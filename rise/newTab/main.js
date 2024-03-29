// Presets for sky color
const skyNightColor = "#070B34";
const skyTwilight1Color = "#18404e";
const skyTwilight2Color = "#316577";
const skyTwilight3Color = "#63b4cf";
const skyDayColor = "#b1dae7";
const skyColorGradient = getColorGradient([skyNightColor, skyTwilight1Color, skyTwilight2Color, skyTwilight3Color, skyDayColor], 88);

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
 * Set to true to enable the slider overrides
 */
const timeDebug = false;
const moonPhaseDebug = false;

let debugMoonCyclePercentage = 0;

// variables for fetched data
let celestialPositionData;
let newMoonsData;

window.onload = async function () {
    createStars();
    const fetchedData = await Promise.all([fetchCelestialPositionAPIData(), fetchMoonPhaseAPIData()]);

    celestialPositionData = fetchedData[0];
    newMoonsData = fetchedData[1].dates;
    updateTime();

    if (timeDebug || moonPhaseDebug) {
        loadDebugModes();
    } else {
        document.getElementById("debugSliders").remove();
        setInterval(updateTime, 10);
    }
    removeLoadingScreen();

    /**
     * Creates sliders to manually set different values. 
     */
    function loadDebugModes() {
        const sliderContainer = document.getElementById("debugSliders");

        if (timeDebug) {
            const timeSlider = createSlider("time", 0, 1439);
            timeSlider.oninput = function () {
                // TODO standardize usage of minutesPastMidnight OR currentDate (leaning towards minutesPastMidnight)
                minutesPastMidnight = this.value;
                currentDate.setHours(Math.floor(minutesPastMidnight / 60));
                currentDate.setMinutes(minutesPastMidnight % 60);
                currentDate.setSeconds(0);
                currentDate.setMilliseconds(0);
    
                onTimeChanged();
            }
        }
        
        if (moonPhaseDebug) {
            const moonPhaseSlider = createSlider("time");
            moonPhaseSlider.oninput = function() {
                debugMoonCyclePercentage = this.value / 100;
                onTimeChanged();
            }
        }

        /**
         * Creates a debug slider with the parameters
         * @param {number} elementID The id assigned to the slider: idDebugSlider
         * @param {number} minVal The minimun value of the slider.
         * @param {number} maxVal The maximun value of the slider.
         * @returns 
         */
        function createSlider(elementID, minVal, maxVal) {
            const newSlider = document.createElement("input");
            newSlider.id = elementID + "DebugSlider";
            newSlider.setAttribute("type","range");
            newSlider.classList.add("slider");
            newSlider.setAttribute("min", "" + minVal);
            newSlider.setAttribute("max", "" + maxVal);

            sliderContainer.appendChild(newSlider);
            return newSlider;
        }
        
    }

    /**
     * Fades out and removes loading screen.
     */
    function removeLoadingScreen() {
        const loadingScreen = document.getElementById("loadingScreen");
        loadingScreen.style.opacity = 0;
        loadingScreen.addEventListener("transitionend", () => loadingScreen.remove());
    }
};

/**
 * Generates stars in the night sky.
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
    updateTextColors();
    updateClock();
    updateGreeting();
    updateBackground();
    
}
/**
 * Changes the color of text based of the background brightness
 */
function updateTextColors() {
    let newTextColor;
    const brightness = getSunBrightnessFactor();
    if (brightness >= 1) {
        newTextColor = "black"
    } else if (brightness <= 0) {
        newTextColor = "white"
    } else {
        return;
    }

    for (const text of document.getElementsByClassName("text")) {
        text.style.color = newTextColor;
    }
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
 * @returns {number} Minutes elapsed since 00:00:00
 */
function getMinsFromTimeString(timeString) {
    let splitString = timeString.split(":");
    return parseInt(splitString[0]) * 60 + parseInt(splitString[1]);
}

/**
 * @typedef {Object} CelestialPositionData
 * Stores rise and set of celestial objects.
 * 
 * Used inside {@link CelestialPositionsData}
 * @property {number} riseTimeMins When the object rises, in minutes past midnight.
 * @property {number} setTimeMins When the object sets, in minutes past midnight.
 * @property {number} formulaCoefficient Coefficient used in the formula to calculate the object's altitude at any given time.
 */

/**
* @typedef {Object} CelestialPositionsData
* Stores information parsed from IPGeolocation API
* 
* @property {String} date What day the data was fetched.
* @property {number} givenTimeMins What time the data was fetched, in minutes past midnight.
* @property {CelestialPositionData} sun Rise/set times of the sun.
* @property {CelestialPositionData} moon Rise/set times of the moon.
*/

/** 
* Fetches data of sunrise, sunset, moonrise, moonset times from IPGeolocation API, or loads it from local storage if available.
* @returns {Promise<CelestialPositionsData>} Object containing all relevant data. See {@link CelestialPositionsData} and {@link CelestialPositionData}.
*/
function fetchCelestialPositionAPIData() {

    const defaultData = {
        "success": false,
        "date": getDateString(currentDate),
        "givenTimeMins": 720,
        "sun": {
            "riseTimeMins": 6 * 60,
            "setTimeMins": (6 + 12) * 60,
            "formulaCoefficient": 65
        },
        "moon": {
            "riseTimeMins": (6 + 12) * 60,
            "setTimeMins": (6 + 24) * 60,
            "formulaCoefficient": 65
        }
    }

    return new Promise(async (resolve, reject) => {

        let data = JSON.parse(localStorage.getItem("celestialPositions"));

        if (data == null || data.success == false || data.date != getDateString(currentDate)) {
            localStorage.removeItem("celestialPositions");

            const canUseGeolocation = await navigator.permissions.query({ name: 'geolocation' });
            console.log(canUseGeolocation.state);
            if (canUseGeolocation.state == 'granted') {
                try {
                    const response = await fetch("https://api.ipgeolocation.io/astronomy?apiKey=b599741103fc4cccae8e98313394a59b");

                    data = await parseAPIResponse(response);
                    localStorage.setItem("celestialPositions", JSON.stringify(data));
                } catch (error) {
                    data = defaultData;
                }
            } else {
                data = defaultData
            }
        }
        resolve(data);
    });

    /**
     * Gets moonrise/moonset of next day.
     * 
     * Used when the upcoming moonrise/moonset doesn't happen until the next day (happens near half moons).
     * @param {boolean} willReturnMoonrise If set to true, returns the moonrise of the following day. Otherwise, returns the moonset instead.
     * @returns {Promise<number>} The time the moonrise/moonset happens, in minutes past midnight.
     */
    async function fetchNextMoonriseOrMoonset(willReturnMoonrise) {
        return await new Promise(async (resolve, reject) => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            const nextDayResponse = await fetch("https://api.ipgeolocation.io/astronomy?apiKey=b599741103fc4cccae8e98313394a59b&date=" + getDateString(tomorrow));
            const nextDayJSON = await nextDayResponse.json();

            if (willReturnMoonrise) {
                resolve(getMinsFromTimeString(nextDayJSON.moonrise) + 24 * 60);
            } else {
                resolve(getMinsFromTimeString(nextDayJSON.moonset) + 24 * 60);
            }
            reject("idk 3");
        });
    }

    /**
     * Converts API response into {@link CelestialPositionsData} containing relevant data.
     * @param {Response} response The API response.
     * @returns {CelestialPositionsData} Object containing all relevant data.
     */
    async function parseAPIResponse(response) {
        try {
            const responseJSON = await response.json();
            const givenTimeMins = getMinsFromTimeString(responseJSON.current_time);
            const givenSunAltitude = responseJSON.sun_altitude;
            const sunriseTimeMins = getMinsFromTimeString(responseJSON.sunrise);
            const sunsetTimeMins = getMinsFromTimeString(responseJSON.sunset);
            const givenMoonAltitude = responseJSON.moon_altitude;
            let moonriseTimeMins = getMinsFromTimeString(responseJSON.moonrise);
            let moonsetTimeMins = getMinsFromTimeString(responseJSON.moonset);

            // Checks if moonrise and moonset are on the same day
            if (isNaN(moonriseTimeMins)) {
                moonriseTimeMins = await fetchNextMoonriseOrMoonset(true);
            } else if (isNaN(moonsetTimeMins)) {
                moonsetTimeMins = await fetchNextMoonriseOrMoonset(false);
            }

            const sunFormulaCoefficient = givenSunAltitude / Math.sin(Math.PI * (givenTimeMins - sunriseTimeMins) / (sunsetTimeMins - sunriseTimeMins));
            const moonFormulaCoefficient = givenMoonAltitude / Math.sin(Math.PI * (givenTimeMins - moonriseTimeMins) / (moonsetTimeMins - moonriseTimeMins));

            const formattedData = {
                "success": true,
                "date": getDateString(currentDate),
                "givenTimeMins": givenTimeMins,
                "sun": {
                    "riseTimeMins": sunriseTimeMins,
                    "setTimeMins": sunsetTimeMins,
                    "formulaCoefficient": sunFormulaCoefficient
                },
                "moon": {
                    "riseTimeMins": moonriseTimeMins,
                    "setTimeMins": moonsetTimeMins,
                    "formulaCoefficient": moonFormulaCoefficient
                }
            }

            return formattedData;
        } catch (error) {
            throw (error);
        }
    }
}

/**
 * @typedef {Object} MoonPhaseData
 * Object containing new moon dates and the year of recording.
 * @property {number} year The year the data was fetched.
 * @property {Array<String>} dates Array of all new moon occurences from the previous year to the following year. Date objects are stored in string form.
 */

/**
 * Fetches data of moon phases for the current, previous, and next year, or loads it from local storage if available.
 * @returns {Promise<MoonPhaseData>} Object containing all relevant data. See {@link MoonPhaseData}.
 */
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

/**
 * Updates the appearance and position of background objects based on the time.
 */
function updateBackground() {
    if (celestialPositionData == null) {
        console.warn("No json data loaded.");
        return;
    }
    const skyElements = document.getElementsByClassName("sky");
    const sun = document.getElementById("sun");
    const moon = document.getElementById("moon");

    // Default values of sun and moon positions
    const sunX = 110;
    const moonX = 30;
    const celestialPeak = 10;
    const celestialHorizon = 50;

    updateSkyColor();
    updateCelestialPositions();
    updateNightCelestialTransparency();
    updateMoonPhase();
    updateStarRotation();
    updateMountainColors();

    /**
     * Changes the color of the sky based on the sun brightness, getting colors from {@link skyColorGradient}.
     */
    function updateSkyColor() {
        const brightness = getSunBrightnessFactor();
        const skyColorIndex = Math.floor(brightness * (skyColorGradient.length - 1));
        const skyColor = skyColorGradient[skyColorIndex];

        for (let i = 0; i < skyElements.length; i++) {
            skyElements.item(i).style.fill = skyColor;
        }
    }

    /**
     * Changes the positions of the sun and moon.
     */
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

    /**
     * Changes the transparency of the moon, stars, and future night sky objects based on the sun's brightness.
     * 
     * If sun altitude is > 0, night celestials are invisible.
     * 
     * If sun altitude is < -10, transition opacity.
     */
    function updateNightCelestialTransparency() {
        const nightCelestials = document.getElementsByClassName("nightCelestial");
        const opacity = 1 - getSunBrightnessFactor();

        for (let i = 0; i < nightCelestials.length; i++) {
            const nightCelestial = nightCelestials[i];
            nightCelestial.style.opacity = opacity;
        }

        sun.style.opacity = 1 - opacity;
    }

    /**
     * Updates the appearance of the moon based on the moon phase.
     * 
     * Graph of "curve radius" https://www.desmos.com/calculator/yg9kzupbap
     */
    function updateMoonPhase() {

        const moonObject = document.getElementById("moonObject");

        const currentDateMS = currentDate.getTime();
        let prevNewMoonDateMS = Date.parse(newMoonsData[0]);

        let moonCyclePercentage;

        if (moonPhaseDebug) {
            moonCyclePercentage = debugMoonCyclePercentage; // uses debug value instead
        } else {
            // finds which new moon dates we are between and how far in the cycle we progressed
            for (let i = 1; i < newMoonsData.length; i++) {
                const nextNewMoonDateMS = Date.parse(newMoonsData[i]);
                if (currentDateMS > nextNewMoonDateMS) {
                    prevNewMoonDateMS = nextNewMoonDateMS;
                } else {
                    moonCyclePercentage = (currentDateMS - prevNewMoonDateMS) / (nextNewMoonDateMS - prevNewMoonDateMS);
                    break;
                }
            }
        }

        // Prevents glitching with "infinite" radius during half moons
        if (moonCyclePercentage == 0.25 || moonCyclePercentage == 0.75) {
            moonCyclePercentage -= 0.00001;
        }

        // swaps between waxing and waning
        if (moonCyclePercentage > 0.5) {
            moonObject.setAttribute("transform","rotate(180)");
        } else {
            moonObject.setAttribute("transform","rotate(0)");
        }
                
        const curveRadius = 5 / Math.cbrt(Math.cos(2 * Math.PI * moonCyclePercentage));

        // swaps between crescent and gibbous
        const flipCurve = (moonCyclePercentage > 0.25 && moonCyclePercentage < 0.75) ? 0 : 1;

        moonObject.setAttribute("d","M 0 5 A 5 5 0 0 0 0 -5 A " + curveRadius + " " + curveRadius + " 0 0 " + flipCurve + " 0 5")
    }

    /**
     * Slowly rotates the stars to the left (east to west) across the sky.
     */
    function updateStarRotation() {
        const stars = document.getElementById("stars");
        stars.setAttribute("transform", "translate(80,60) rotate(" + (180 * ((1400 - minutesPastMidnight) / 1400)) + ")");
    }

    /**
    * Changes the color of the mountains based on the sun's brightness, getting colors from {@link mountainLeftGradient} and {@link mountainRightGradient}.
    */
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

    /**
     * Gets the altitude of the moon.
     * @returns {number} Altitude of the moon.
     */
    function getMoonAltitude() {
        return getCelestialAltitude(celestialPositionData.moon);
    }

    /**
     * Adjusts the altitude of a celestial object to scale with the preset horizon/peak.
     * 
     * Ensures that the celestial object is always on screen.
     * @param {number} altitude Altitude of celestial object to format.
     * @returns {number} Formatted altitude.
     */
    function formatCelestialAltitude(altitude) {
        return -1 * (celestialHorizon - celestialPeak) * altitude / 90 + celestialHorizon;
    }
}

    /**
     * Gets the altitude of the sun.
     * 
     * Reference for formula:
     * 
     * https://sinovoltaics.com/learning-center/basics/declination-angle/
     * 
     * https://sciencing.com/many-hours-daylight-summer-8196183.html
     * 
     * https://www.desmos.com/calculator/y5ymbedinl
     * @returns {number} Altitude of the sun.
     */
 function getSunAltitude() {
    // TODO implement more accurate formula
    // const declination = -23.45 * Math.cos(2 * Math.PI / 365 * (getDayOfYear() + 10)) * Math.sign(coords.latitude);
    // const altitudeAtNoon = 90 - Math.abs(coords.latitude) + declination;
    return getCelestialAltitude(celestialPositionData.sun);
}

function getCelestialAltitude(celestialJSON) {
    // TODO have some proper documentation explaining the formula
    return celestialJSON.formulaCoefficient * Math.sin(Math.PI * (minutesPastMidnight - celestialJSON.riseTimeMins) / (celestialJSON.setTimeMins - celestialJSON.riseTimeMins));
}

/**
 * Gets the sun's brightness, based on its altitude.
 * 
 * Used to set the opacity of night objects and color of mountains.
 * @returns {number} Brightness of the sun.
 */
function getSunBrightnessFactor() {
    const sunAlitutde = getSunAltitude();
    let brightnessFactor;
    if (sunAlitutde > -5) {
        brightnessFactor = 1;
    }
    else if (sunAlitutde < -20) {
        brightnessFactor = 0;
    }
    else {
        brightnessFactor = (sunAlitutde + 20) / 15;
    }
    return brightnessFactor;
}

// TODO document
function getColorGradient(mainColors, gradientSize) {
    verifyInputs();

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

    function verifyInputs() {
        if (mainColors.length < 2) {
            console.warn("mainColors should be an array of at least two colors");
            return [];
        } else if (gradientSize % (mainColors.length - 1) != 0) {
            console.warn("uneven gradient size");
            return [];
        }
    }

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
}
