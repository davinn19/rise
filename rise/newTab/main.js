// Presets for sky color
const skyNightColor = "#070B34";
const skyTwilight1Color = "#18404e";
const skyTwilight2Color = "#316577";
const skyTwilight3Color = "#63b4cf";
const skyDayColor = "#b1dae7";
const sunriseGradient = getColorGradient([skyNightColor, skyTwilight1Color, skyTwilight2Color, skyTwilight3Color, skyDayColor], 88);
const sunsetGradient = getColorGradient([skyDayColor, skyTwilight3Color, skyTwilight2Color, skyTwilight1Color, skyNightColor], 88);

// Presets for mountain colors
const mountainRightNightColor = "#6b2390";
const mountainLeftNightColor = "#6918b4";
const mountainRightDayColor = "#2c93cc";
const mountainLeftDayColor = "#2375a3";
const mountainRightGradient = getColorGradient([mountainRightNightColor, mountainRightDayColor], 100);
const mountainLeftGradient = getColorGradient([mountainLeftNightColor, mountainLeftDayColor], 100);

let minutesPastMidnight = 0;
let currentDate = new Date();
let oldMinutes = -1;

/**
 * Set to true to enable the slider override
 */
let sliderEnabled = true;

// variables for fetched data
let celestialPositionData;
let newMoonsData;

window.onload = async function () {
    const fetchedData = await Promise.all([fetchCelestialPositionAPIData(), fetchMoonPhaseAPIData()]);

    celestialPositionData = fetchedData[0];
    newMoonsData = fetchedData[1].dates;
    updateTime();

    if (sliderEnabled) {
        loadSliderDebug();
    } else {
        setInterval(updateTime, 10);
    }

    removeLoadingScreen();
};

/**
 * Overrides the updating time with a manual slider, meant for debugging. 
 */
function loadSliderDebug() {
    let slider = document.getElementById("myRange");
    slider.oninput = function () {
        // TODO standardize usage of minutesPastMidnight OR currentDate (leaning towards minutesPastMidnight)
        minutesPastMidnight = this.value;
        currentDate.setHours(Math.floor(minutesPastMidnight / 60));
        currentDate.setMinutes(minutesPastMidnight % 60);
        currentDate.setSeconds(0);
        currentDate.setMilliseconds(0);

        onTimeChanged();
    }
}

/**
 * Generates stars in the night sky
 */
function createStars() {
    const starGroup = document.getElementById("stars");
    for (let i = 0; i < 500; i++) {
        const newStar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        newStar.setAttribute("class", "star");
        const starSize = Math.random() / 2 + 0.25;
        newStar.setAttribute("width", starSize + "");
        newStar.setAttribute("height", starSize + "");
        newStar.setAttribute("x", Math.random() * 320 - 160 + "");
        newStar.setAttribute("y", Math.random() * 180 - 90 + "");
        newStar.setAttribute("transform", "rotate(" + Math.random() * 90 + ")");

        starGroup.appendChild(newStar);
    }
}

/**
 * Updates the currentDate variable, calling onTimeChanged if the time changed by a minute.
 */
function updateTime() {
    currentDate = new Date();
    const minutes = currentDate.getMinutes();
    if (minutes != oldMinutes) {
        oldMinutes = minutes;
        minutesPastMidnight = currentDate.getHours() * 60 + currentDate.getMinutes();
        onTimeChanged();
    }
}

/**
 * Calls any function that updates based on time
 */
function onTimeChanged() {
    updateClock();
    updateGreeting();
    updateBackground();
}

/**
 * Updates the time displayed by the clock.
 */
function updateClock() {
    let hour = currentDate.getHours();
    const minute = currentDate.getMinutes();

    let timeSuffix;
    if (hour < 12) {
        timeSuffix = "am";
    } else {
        timeSuffix = "pm";
    }

    // Adjusts hours from 24 hr to 12 hr format
    if (hour == 0) {
        hour = 12;
    } else if (hour > 12) {
        hour -= 12;
    }

    // Always displays minutes with 2 digits
    const minuteString = minute.toLocaleString("en-US", {
        minimumIntegerDigits: 2,
        useGrouping: false,
    });

    document.getElementById("clockNumbers").textContent = "" + hour + ":" + minuteString;
    document.getElementById("clockTimeOfDay").textContent = timeSuffix;
}

/**
 * Updates greeting based on time of day.
 */
function updateGreeting() {
    const hour = currentDate.getHours();
    let greeting;

    if (hour >= 22 || hour < 5) {
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

/**
 * Gets a string representation of a Date object in YYYY-MM-DD format.
 * 
 * @param {Date} date - The Date object
 * @returns {String} The string represtentation of the Date object, in YYYY-MM-DD format
 */
function getDateString(date) {
    const dateString =
        date.getFullYear() +
        "-" +
        (date.getMonth() + 1).toLocaleString("en-US", {
            minimumIntegerDigits: 2,
            useGrouping: false,
        }) +
        "-" +
        date.getDate().toLocaleString("en-US", {
            minimumIntegerDigits: 2,
            useGrouping: false,
        });
    return dateString;
}

/**
 * Converts a string representation of time in hr:min:sec format into only minutes, discarding seconds and milliseconds.
 * 
 * @param {String} timeString String representation of time (hr:min:sec)
 * @returns {int} Total minutes between hours and minutes
 */
function getMinsFromTimeString(timeString) {
    let splitString = timeString.split(":");
    return parseInt(splitString[0]) * 60 + parseInt(splitString[1]);
}

/**
 * Fades out and removes loading screen.
 */
function removeLoadingScreen() {
    const loadingScreen = document.getElementById("loadingScreen");
    loadingScreen.style.opacity = 0;
    loadingScreen.addEventListener("transitionend", () => loadingScreen.remove());
}

function getCoordinates() {
    return new Promise((resolve, reject) => {
        try {
            navigator.geolocation.getCurrentPosition((position) => resolve(position.coords));
        } catch (error) {
            reject(error);
        }
    });
}

function fetchCelestialPositionAPIData() {
    // Gets moonrise/moonset of next day if current day doesn't have it
    async function fetchNextMoonriseOrMoonset(willReturnMoonrise) {
        return await new Promise(async (resolve, reject) => {
            const coords = await getCoordinates();
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            const nextDayResponse = await fetch("https://api.ipgeolocation.io/astronomy?apiKey=b599741103fc4cccae8e98313394a59b&lat=" + coords.latitude + "&long=" + coords.longitude + "&date=" + getDateString(tomorrow));
            const nextDayJSON = await nextDayResponse.json();

            if (willReturnMoonrise) {
                resolve(getMinsFromTimeString(nextDayJSON.moonrise) + 24 * 60);
            } else {
                resolve(getMinsFromTimeString(nextDayJSON.moonset) + 24 * 60);
            }
            reject("idk 3");
        });
    }

    return new Promise(async (resolve, reject) => {

        let data = JSON.parse(localStorage.getItem("celestialPositions"));

        if (data == null || data.date != getDateString(currentDate)) {
            localStorage.removeItem("celestialPositions");

            try {
                const coords = await getCoordinates();
                const response = await fetch("https://api.ipgeolocation.io/astronomy?apiKey=b599741103fc4cccae8e98313394a59b&lat=" + coords.latitude + "&long=" + coords.longitude);
                const responseJSON = await response.json();

                const givenTimeMins = getMinsFromTimeString(responseJSON.current_time);
                const givenSunAltitude = responseJSON.sun_altitude;
                const sunriseTimeMins = getMinsFromTimeString(responseJSON.sunrise);
                const sunsetTimeMins = getMinsFromTimeString(responseJSON.sunset);
                const givenMoonAltitude = responseJSON.moon_altitude;
                let moonriseTimeMins = getMinsFromTimeString(responseJSON.moonrise);
                let moonsetTimeMins = getMinsFromTimeString(responseJSON.moonset);

                // Gets moonrise/moonset of next day if current day doesn't have it
                if (isNaN(moonriseTimeMins)) {
                    moonriseTimeMins = await fetchNextMoonriseOrMoonset(true);
                } else if (isNaN(moonsetTimeMins)) {
                    moonsetTimeMins = await fetchNextMoonriseOrMoonset(false);
                }

                const formattedJSONData = {
                    "date": getDateString(currentDate),
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

                data = {
                    "year": currentYear,
                    "dates": lastYearJSON.concat(currentYearJSON).concat(nextYearJSON)
                }

                localStorage.setItem("newMoons", JSON.stringify(data));

            } catch (error) {
                reject(error);
            }
        }

        resolve(data);
    });
}

function updateBackground() {
    if (celestialPositionData == null) {
        console.warn("No json data loaded.");
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
            skyColor = skyNightColor;
        } else if (minutesPastMidnight >= sunsetStart) {
            // find sunset gradient
            const minutesPastSunset = minutesPastMidnight - sunsetStart;
            skyColor = sunsetGradient[minutesPastSunset];
        } else if (minutesPastMidnight > sunriseEnd) {
            skyColor = skyDayColor;
        } else {
            // find sunrise gradient
            const minutesPastSunrise = minutesPastMidnight - sunriseStart;
            skyColor = sunriseGradient[minutesPastSunrise];
        }

        for (let i = 0; i < skyElements.length; i++) {
            skyElements.item(i).style.fill = skyColor;
        }
    }

    function updateCelestialPositions() {
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
        const opacity = 1 - getSunBrightnessFactor();

        for (let i = 0; i < nightCelestials.length; i++) {
            const nightCelestial = nightCelestials[i];
            nightCelestial.style.opacity = opacity;
        }
    }

    function updateMoonPhase() {
        const negativeMoon = document.getElementById("moonNegative");
        const negativeRadius = Number.parseFloat(negativeMoon.getAttribute("r"));
        const moonRadius = Number.parseFloat(document.getElementById("moonObject").getAttribute("r"));
        const negativeMoonDefaultPosition = negativeRadius + moonRadius;

        negativeMoon.setAttribute("cx", getNegativeMoonPosition());

        function getNegativeMoonPosition() {
            const currentDateMS = currentDate.getTime();
            let prevNewMoonDateMS = Date.parse(newMoonsData[0]);

            for (let i = 1; i < newMoonsData.length; i++) {
                const nextNewMoonDateMS = Date.parse(newMoonsData[i]);
                if (currentDateMS > nextNewMoonDateMS) {
                    prevNewMoonDateMS = nextNewMoonDateMS;
                } else {
                    // TODO implement wave formula instead of linear, explain formula
                    return -negativeMoonDefaultPosition + 2 * negativeMoonDefaultPosition * (currentDateMS - prevNewMoonDateMS) / (nextNewMoonDateMS - prevNewMoonDateMS);
                }
            }

            // should never go past this line
            console.warn("Something went wrong with finding the moon phase, returning -5 by default");
            return -5;
        }
    }

    function updateStarRotation() {
        const stars = document.getElementById("stars");
        stars.setAttribute("transform", "translate(80,60) rotate(" + (180 * ((1400 - minutesPastMidnight) / 1400)) + ")");
    }

    function updateMountainColors() {
        const mountainRights = document.getElementsByClassName("mountainRight");
        const mountainLefts = document.getElementsByClassName("mountainLeft");

        const colorIndex = Math.floor((mountainLeftGradient.length - 1) * getSunBrightnessFactor());

        for (let i = 0; i < mountainRights.length; i++) {
            const mountainRight = mountainRights[i];
            mountainRight.setAttribute("style", "fill:" + mountainRightGradient[colorIndex]);
        }

        for (let i = 0; i < mountainRights.length; i++) {
            const mountainLeft = mountainLefts[i];
            mountainLeft.setAttribute("style", "fill:" + mountainLeftGradient[colorIndex]);
        }
    }

    function getSunAltitude() {
        return getCelestialAltitude(celestialPositionData.sun);
    }

    function getMoonAltitude() {
        return getCelestialAltitude(celestialPositionData.moon);
    }

    function getCelestialAltitude(celestialJSON) {
        // TODO have some proper documentation explaining the formula
        return celestialJSON.formulaCoefficient * Math.sin(Math.PI * (minutesPastMidnight - celestialJSON.riseTimeMins) / (celestialJSON.setTimeMins - celestialJSON.riseTimeMins));
    }

    function formatCelestialAltitude(altitude) {
        // TODO have some proper documentation explaining the formula
        return -1 * (celestialHorizon - celestialPeak) * altitude + celestialHorizon;
    }

    // Used to set opacity of night objects and color of mountain
    function getSunBrightnessFactor() {
        const sunAlitutde = getSunAltitude() * 90;
        let brightnessFactor;
        if (sunAlitutde > 0) {
            brightnessFactor = 1;
        }
        else if (sunAlitutde < -10) {
            brightnessFactor = 0;
        }
        else {
            brightnessFactor = (sunAlitutde + 10) / 10;
        }
        return brightnessFactor;
    }

    updateSkyColor();
    updateCelestialPositions();
    updateNightCelestialTransparency();
    updateMoonPhase();
    updateStarRotation();
    updateMountainColors();
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
        console.warn("mainColors should be an array of at least two colors");
        return [];
    } else if (gradientSize % (mainColors.length - 1) != 0) {
        console.warn("uneven gradient size");
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
