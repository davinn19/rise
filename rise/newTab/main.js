// Presets for sky color
const nightColor = "#070B34";
const twilight1Color = "#18404e";
const twilight2Color = "#316577";
const twilight3Color = "#63b4cf";
const dayColor = "#b1dae7";
const sunriseGradient = getColorGradient([nightColor, twilight1Color, twilight2Color, twilight3Color, dayColor], 88);
const sunsetGradient = getColorGradient([dayColor, twilight3Color, twilight2Color, twilight1Color, nightColor], 88);
let minutesPastMidnight = 0;

// variables for calculating sun/moon altitude
let jsonData;

window.onload = function () {
    updateClock();
    updateGreeting();

    loadAstronomyData();
    updateBackground();

    let slider = document.getElementById("myRange");
    // Update the current slider value (each time you drag the slider handle)
    slider.oninput = function() {
        minutesPastMidnight = this.value;
        updateBackground();
    }
};

function updateClock() {
    const date = new Date();
    let hour = date.getHours();
    const minute = date.getMinutes();

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
    const hour = new Date().getHours();
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

setInterval(updateClock, 10);
setInterval(updateBackground, 10);
setInterval(updateGreeting, 10000);

function loadAstronomyData() {
    function getDateString() {
        const today = new Date();
        const dateString =
            today.getFullYear() +
            "-" +
            (today.getMonth() + 1).toLocaleString("en-US", {
                minimumIntegerDigits: 2,
                useGrouping: false,
            }) +
            "-" +
            today.getDate().toLocaleString("en-US", {
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

    function fetchNewestAPIData() {
        navigator.geolocation.getCurrentPosition((position) => {
            fetch(
                "https://api.ipgeolocation.io/astronomy?apiKey=b599741103fc4cccae8e98313394a59b&lat=" +
                    position.coords.latitude +
                    "&long=" +
                    position.coords.longitude
            )
                .then((response) => response.json())
                .then((responseJSON) => {
                    const givenTimeMins = getMinsFromTimeString(responseJSON.current_time);
                    const givenSunAltitude = responseJSON.sun_altitude;
                    const sunriseTimeMins = getMinsFromTimeString(responseJSON.sunrise);
                    const sunsetTimeMins = getMinsFromTimeString(responseJSON.sunset);
                    const givenMoonAltitude = responseJSON.moon_altitude;
                    const moonriseTimeMins = getMinsFromTimeString(responseJSON.moonrise);
                    const moonsetTimeMins = getMinsFromTimeString(responseJSON.moonset);

                    const formattedJSONData = {
                        "date" : getDateString(),
                        "givenTimeMins" : givenTimeMins,
                        "sun" : {
                            "givenAltitude" : givenSunAltitude,
                            "riseTimeMins" : sunriseTimeMins,
                            "setTimeMins" : sunsetTimeMins,
                            "formulaCoefficient" : givenSunAltitude / Math.sin(Math.PI * (givenTimeMins - sunriseTimeMins) / (sunsetTimeMins - sunriseTimeMins)) / 90
                        },
                        "moon" : {
                            "givenAltitude" : givenMoonAltitude,
                            "riseTimeMins" : moonriseTimeMins,
                            "setTimeMins" : moonsetTimeMins,
                            "formulaCoefficient" : givenMoonAltitude / Math.sin(Math.PI * (givenTimeMins - moonriseTimeMins) / (moonsetTimeMins - moonriseTimeMins)) / 90
                        }
                    }

                    localStorage.setItem("data", JSON.stringify(formattedJSONData));
                    removeLoadingScreen();
                    return responseJSON;
                });
        });

        const currentYear = new Date().getFullYear();
        fetch("https://craigchamberlain.github.io/moon-data/api/new-moon-data/" +  + "/")
        .then((response) => response.json())
        .then((responseJSON) => {
            localStorage.setItem()

        });
    }

    jsonData = JSON.parse(localStorage.getItem("data"));

    if (jsonData == null || jsonData.date != getDateString()) {
        jsonData = null;
        localStorage.clear();
        jsonData = fetchNewestAPIData();
    } else {
        removeLoadingScreen();
    }
}

function updateBackground() {
    if (jsonData == null) {
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
    const date = new Date();
    // minutesPastMidnight = date.getHours() * 60 + date.getMinutes();

    const sunriseStart = jsonData.sun.riseTimeMins - 88;
    const sunriseEnd = sunriseStart + 88;
    const sunsetStart = jsonData.sun.setTimeMins;
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
            "translate(" + moonX + "," + formatCelestialAltitude(getMoonAltitude()) + ")"
        );
    }

    function updateNightCelestialTransparency() {
        // if sun altitude is > 0, night celestials are invisible
        // if sun altitude is < -10, transition opacity
        
        const nightCelestials = document.getElementsByClassName("nightCelestial");
        let opacity;
        const sunAlitutde = getSunAltitude() * 90;
        console.log(sunAlitutde);
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
    }

    function getSunAltitude() {
        return getCelestialAltitude(jsonData.sun);
    }

    function getMoonAltitude() {
        return getCelestialAltitude(jsonData.moon);
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
