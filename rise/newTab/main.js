// Presets for sky color
const nightColor = "#070B34";
const twilight1Color = "#18404e";
const twilight2Color = "#316577";
const twilight3Color = "#63b4cf";
const dayColor = "#b1dae7";
const sunriseGradient = getColorGradient([nightColor, twilight1Color, twilight2Color, twilight3Color, dayColor], 88);
const sunsetGradient = getColorGradient([dayColor, twilight3Color, twilight2Color, twilight1Color, nightColor], 88);
let minutesPastMidnight = 0;
let currentDate = new Date();
let oldMinutes = -1;

// Set to true to debug with slider
let sliderEnabled = true;

// variables for fetched data
let celestialPositionData;
let newMoonsData;

window.onload = async function() {
    const fetchedData = await Promise.all([fetchCelestialPositionAPIData(), fetchMoonPhaseAPIData()]);

    celestialPositionData = fetchedData[0];
    newMoonsData = fetchedData[1];
    updateTime();

    if (sliderEnabled) {
        let slider = document.getElementById("myRange");
        slider.oninput = function () {
            // TODO standardize usage of minutesPastMidnight OR currentDate (leaning towards minutesPastMidnight)
            minutesPastMidnight = this.value;
            onTimeChanged();
        }
    }
    else {
        setInterval(updateTime, 10);
    }

    const starGroup = document.getElementById("stars");
    for (let i = 0; i < 250; i++) {
        const newStar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        newStar.setAttribute("class","star");
        const starSize = Math.random() / 2 + 0.25;
        newStar.setAttribute("width", starSize + "");
        newStar.setAttribute("height", starSize + "");
        newStar.setAttribute("x", Math.random() * 160 + "");
        newStar.setAttribute("y", Math.random () * 90 + "");
        newStar.setAttribute("transform","rotate(" + Math.random() * 90 + ")");

        starGroup.appendChild(newStar);
    }

    removeLoadingScreen();
};

function updateTime() {
    currentDate = new Date();
    const minutes = currentDate.getMinutes();
    if (minutes != oldMinutes) {
        oldMinutes = minutes;
        minutesPastMidnight = currentDate.getHours() * 60 + currentDate.getMinutes();
        onTimeChanged();
    }
}

function onTimeChanged() {
    updateClock();
    updateGreeting();
    updateBackground();
}

function updateClock() {
    let hour = currentDate.getHours();
    const minute = currentDate.getMinutes();

    let timeSuffix;
    if (hour < 12) {
        timeSuffix = "am";
    } else {
        timeSuffix = "pm";
    }

    if (hour == 0) {
        hour = 12;
    } else if (hour > 12) {
        hour -= 12;
    }

    let minuteString;
    if (minute < 10) {
        minuteString = "0" + minute;
    } else {
        minuteString = "" + minute;
    }

    document.getElementById("clockNumbers").textContent = "" + hour + ":" + minuteString;
    document.getElementById("clockTimeOfDay").textContent = timeSuffix;
}

function updateGreeting() {
    const hour = currentDate.getHours();
    let greeting;

    if (hour >= 22 || hour < 4) {
        greeting = "night";
    } else if (hour >= 18) {
        greeting = "evening";
    } else if (hour >= 12) {
        greeting = "afternoon";
    } else {
        greeting = "morning";
    }
    document.getElementById("greeting").textContent = "Good " + greeting + ".";
}

// TODO FIX START //
function getDateString() {
    const dateString =
        currentDate.getFullYear() +
        "-" +
        (currentDate.getMonth() + 1).toLocaleString("en-US", {
            minimumIntegerDigits: 2,
            useGrouping: false,
        }) +
        "-" +
        currentDate.getDate().toLocaleString("en-US", {
            minimumIntegerDigits: 2,
            useGrouping: false,
        });
    return dateString;
}

// convert hr:min:sec string to mins int, discarding seconds and ms
function getMinsFromTimeString(timeString) {
    let splitString = timeString.split(":");
    return parseInt(splitString[0]) * 60 + parseInt(splitString[1]);
}

function removeLoadingScreen() {
    const loadingScreen = document.getElementById("loadingScreen");
    loadingScreen.style.opacity = 0;
    loadingScreen.addEventListener("transitionend", () => loadingScreen.remove());
}

function getCoordinates() {
    return new Promise((resolve,reject) => {
        try {
            navigator.geolocation.getCurrentPosition((position) => resolve(position.coords));
        } catch (error) {
            reject(error);
        }
    });
}

// TODO try to condense fetching into one function
function fetchCelestialPositionAPIData() {
    return new Promise(async (resolve, reject) => {

        let data = JSON.parse(localStorage.getItem("celestialPositions"));

        if (data == null || data.date != getDateString()) {
            localStorage.removeItem("celestialPosition");

            try {
                const coords = await getCoordinates();
                const response = await fetch("https://api.ipgeolocation.io/astronomy?apiKey=b599741103fc4cccae8e98313394a59b&lat=" + coords.latitude + "&long=" + coords.longitude);
                const responseJSON = await response.json();
                
                const givenTimeMins = getMinsFromTimeString(responseJSON.current_time);
                const givenSunAltitude = responseJSON.sun_altitude;
                const sunriseTimeMins = getMinsFromTimeString(responseJSON.sunrise);
                const sunsetTimeMins = getMinsFromTimeString(responseJSON.sunset);
                const givenMoonAltitude = responseJSON.moon_altitude;
                const moonriseTimeMins = getMinsFromTimeString(responseJSON.moonrise);
                const moonsetTimeMins = getMinsFromTimeString(responseJSON.moonset);
    
                const formattedJSONData = {
                    "date": getDateString(),
                    "givenTimeMins": givenTimeMins,
                    "sun": {
                        "givenAltitude": givenSunAltitude,
                        "riseTimeMins": sunriseTimeMins,
                        "setTimeMins": sunsetTimeMins,
                        "formulaCoefficient": givenSunAltitude / Math.sin(Math.PI * (givenTimeMins - sunriseTimeMins) / (sunsetTimeMins - sunriseTimeMins)) / 90
                    },
                    "moon": {
                        "givenAltitude": givenMoonAltitude,
                        "riseTimeMins": moonriseTimeMins,
                        "setTimeMins": moonsetTimeMins,
                        "formulaCoefficient": givenMoonAltitude / Math.sin(Math.PI * (givenTimeMins - moonriseTimeMins) / (moonsetTimeMins - moonriseTimeMins)) / 90
                    }
                }
    
                localStorage.setItem("celestialPositions", JSON.stringify(formattedJSONData));
                data = formattedJSONData;
            } catch (error) {
                reject(error);
            }

        }

        resolve(data);
    });
}

function fetchMoonPhaseAPIData() {
    return new Promise(async (resolve, reject) => {
        const currentYear = currentDate.getFullYear();
        let data = JSON.parse(localStorage.getItem("newMoons"));
        if (data == null || data.year != currentYear) {

            localStorage.removeItem("newMoons");

            try {
                const responses = await Promise.all([fetch("https://craigchamberlain.github.io/moon-data/api/new-moon-data/" + (currentYear - 1) + "/"), fetch("https://craigchamberlain.github.io/moon-data/api/new-moon-data/" + currentYear + "/"), fetch("https://craigchamberlain.github.io/moon-data/api/new-moon-data/" + (currentYear + 1) + "/")]);
                
                const lastYearJSON = await responses[0].json();
                const currentYearJSON = await responses[1].json();
                const nextYearJSON = await responses[2].json();

                console.log(lastYearJSON, currentYearJSON, nextYearJSON);
                
                data = {
                    "year" : currentYear,
                    "dates" : lastYearJSON.concat(currentYearJSON).concat(nextYearJSON)
                }

                localStorage.setItem("newMoons", JSON.stringify(data));

            } catch (error) {
                reject(error);
            }
        }

        resolve(data);
    });
}

// TODO FIX END //

function updateBackground() {
    if (celestialPositionData == null) {
        console.log("No json data loaded.");
        return;
    }
    const skyElements = document.getElementsByClassName("sky");
    const sun = document.getElementById("sun");
    const moon = document.getElementById("moon");

    const sunX = 110;
    const moonX = 30;
    const celestialPeak = 10;
    const celestialHorizon = 60;

    const sunriseStart = celestialPositionData.sun.riseTimeMins - 88;
    const sunriseEnd = sunriseStart + 88;
    const sunsetStart = celestialPositionData.sun.setTimeMins;
    const sunsetEnd = sunsetStart + 88;

    function updateSkyColor() {
        let skyColor;
        if (minutesPastMidnight > sunsetEnd || minutesPastMidnight < sunriseStart) {
            skyColor = nightColor;
        } else if (minutesPastMidnight >= sunsetStart) {
            // find sunset gradient
            const minutesPastSunset = minutesPastMidnight - sunsetStart;
            skyColor = sunsetGradient[minutesPastSunset];
        } else if (minutesPastMidnight > sunriseEnd) {
            skyColor = dayColor;
        } else {
            // find sunrise gradient
            const minutesPastSunrise = minutesPastMidnight - sunriseStart;
            skyColor = sunriseGradient[minutesPastSunrise];
        }

        for (let i = 0; i < skyElements.length; i++) {
            skyElements.item(i).style.fill = skyColor;
        }
    }

    function updateCelestialPosition() {
        sun.setAttribute(
            "transform",
            "translate(" + sunX + "," + formatCelestialAltitude(getSunAltitude()) + ")"
        );
        moon.setAttribute(
            "transform",
            "translate(" + moonX + "," + formatCelestialAltitude(getMoonAltitude()) + ") rotate(20)"
        );
    }

    function updateNightCelestialTransparency() {
        // if sun altitude is > 0, night celestials are invisible
        // if sun altitude is < -10, transition opacity

        const nightCelestials = document.getElementsByClassName("nightCelestial");
        let opacity;
        const sunAlitutde = getSunAltitude() * 90;
        if (sunAlitutde > 0) {
            opacity = 0;
        }
        else if (sunAlitutde < -10) {
            opacity = 1;
        }
        else {
            opacity = -sunAlitutde / 10;
        }

        for (let i = 0; i < nightCelestials.length; i++) {
            const nightCelestial = nightCelestials[i];
            nightCelestial.style.opacity = opacity;
        }
    }

    function updateMoonPhase() {
        // TODO implement
        const negativeMoon = document.getElementById("moonNegative");
        const negativeRadius = Number.parseFloat(negativeMoon.getAttribute("r"));
        const moonRadius = Number.parseFloat(document.getElementById("moonObject").getAttribute("r"));
        const fullMoonPosition = negativeRadius + moonRadius;

        negativeMoon.setAttribute("cx", getNegativeMoonPosition());

        function getNegativeMoonPosition() {
            const currentDateMS = currentDate.getTime();
            let prevNewMoonDateMS = Date.parse(newMoonsData[0]);

            newMoonsData.forEach((newMoonData) => {

                const currentNewMoonDateMS = Date.parse(newMoonData);

                if (currentDateMS > currentNewMoonDateMS) {
                    prevNewMoonDateMS = currentNewMoonDateMS;
                } else {
                    // TODO use a similar formula as the celestial altitude one
                } 
            });

            console.error("Something went wrong with finding the moon phase, returning -5 by default");
            return -5;
        }
    }

    function getSunAltitude() {
        return getCelestialAltitude(celestialPositionData.sun);
    }

    function getMoonAltitude() {
        return getCelestialAltitude(celestialPositionData.moon);
    }

    // TODO normalize celestial altitude across entire program
    function getCelestialAltitude(celestialJSON) {
        // TODO have some proper documentation explaining the formula
        return celestialJSON.formulaCoefficient * Math.sin(Math.PI * (minutesPastMidnight - celestialJSON.riseTimeMins) / (celestialJSON.setTimeMins - celestialJSON.riseTimeMins));
    }

    function formatCelestialAltitude(altitude) {
        // TODO have some proper documentation explaining the formula
        return -1 * (celestialHorizon - celestialPeak) * altitude + celestialHorizon;
    }

    updateSkyColor();
    updateCelestialPosition();
    updateNightCelestialTransparency();
    updateMoonPhase();
}

// COLOR GRADIENT STUFF //
function componentToHex(c) {
    let hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRgb(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : null;
}

function getColorGradient(mainColors, gradientSize) {
    if (mainColors.length < 2) {
        console.log("mainColors should be an array of at least two colors");
        return [];
    } else if (gradientSize % (mainColors.length - 1) != 0) {
        console.log("uneven gradient size");
        return [];
    }

    const colors = [];
    const colorsPerInterval = gradientSize / (mainColors.length - 1);

    for (let i = 0; i < mainColors.length - 1; i++) {
        const color1 = hexToRgb(mainColors[i]);
        const color2 = hexToRgb(mainColors[i + 1]);

        const rIncrement = Math.round((color2.r - color1.r) / colorsPerInterval);
        const gIncrement = Math.round((color2.g - color1.g) / colorsPerInterval);
        const bIncrement = Math.round((color2.b - color1.b) / colorsPerInterval);

        for (let j = 0; j < colorsPerInterval; j++) {
            const newColor = rgbToHex(
                color1.r + rIncrement * j,
                color1.g + gIncrement * j,
                color1.b + bIncrement * j
            );
            colors.push(newColor);
        }
    }

    return colors;
}
