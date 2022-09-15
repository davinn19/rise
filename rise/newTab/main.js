// Presets for sky color
const nightColor = "#070B34";
const sunriseColor = "#7b95b6";
const dayColor = "#87ceeb";
const sunsetColor = "#FB9062";
const sunriseGradient = getColorGradient([nightColor, sunriseColor, dayColor], 60); // starts at 6:31 am - ends at 7:30 am
const sunsetGradient = getColorGradient([dayColor, sunsetColor, nightColor], 60); // starts at 7:31 pm - ends at 8:30 pm
const sunriseStart = 6 * 60 + 31;   // 6:31 AM
const sunriseEnd = 7 * 60 + 30;     // 7:30 AM
const sunsetStart = (12 + 6) * 60 + 31;   // 6:31 PM
const sunsetEnd = (12 + 7) * 60 + 30;     // 7:30 PM
let minutesPastMidnight = 0;

// TEST time changes

window.onload = function () {
    updateClock();
    updateGreeting();
    updateWeather();
    updateBackground();

    let slider = document.getElementById("myRange");
    // Update the current slider value (each time you drag the slider handle)
    slider.oninput = function() {
        minutesPastMidnight = this.value;
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

    document.getElementById("clockNumbers").textContent =
        "" + hour + ":" + minuteString;
    document.getElementById("clockTimeOfDay").textContent = timeSuffix;
};

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
};

function updateWeather() {
    // console.log(localStorage);
    // TODO implement
}

setInterval(updateClock, 10);
setInterval(updateGreeting, 10);
setInterval(updateWeather, 10);
setInterval(updateBackground, 10);
// setInterval(updateGreeting, 60000);
// setInterval(updateWeather, 1200000);


function updateBackground() {
    const skyElements = document.getElementsByClassName("sky");
    const sun = document.getElementById("sun");
    const moon = document.getElementById("moon");

    const sunMoonX = 110;
    const sunMoonPeak = 20;
    const sunMoonHorizon = 70;
    const date = new Date();
    // const minutesPastMidnight = date.getHours() * 60 + date.getMinutes();

    function updateSkyColor() {
        console.log(minutesPastMidnight);
        let skyColor;
        if (minutesPastMidnight > sunsetEnd || minutesPastMidnight < sunriseStart) {
            skyColor = nightColor;
        } else if (minutesPastMidnight >= sunsetStart) {    // find sunset gradient
            const minutesPastSunset = minutesPastMidnight - sunsetStart;
            skyColor = sunsetGradient[minutesPastSunset];
        } else if (minutesPastMidnight > sunriseEnd) {
            skyColor = dayColor;
        } else {                // find sunrise gradient
            const minutesPastSunrise = minutesPastMidnight - sunriseStart;
            skyColor = sunriseGradient[minutesPastSunrise];
        }

        for (let i = 0; i < skyElements.length; i++) {
            skyElements.item(i).style.fill = skyColor;
        }
    }

    function updateSunMoonPosition() {
        sun.setAttribute("transform", "translate(" + sunMoonX + "," + getSunMoonHeight("sun") + ")");
        moon.setAttribute("transform", "translate(" + sunMoonX + "," + getSunMoonHeight("moon") + ")");
    }

    function getSunMoonHeight(sunOrMoon) {
        let modifier = 1;
        if (sunOrMoon == "moon") {
            modifier = -1;
        }
        return (sunMoonHorizon - sunMoonPeak) * modifier * Math.cos(Math.PI * (minutesPastMidnight - 60) / 720) + sunMoonHorizon;
    }

    updateSkyColor();
    updateSunMoonPosition();
};

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
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
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
            const newColor = rgbToHex(color1.r + rIncrement * j, color1.g + gIncrement * j, color1.b + bIncrement * j);
            colors.push(newColor);
        }
    }
    console.log(colors);

    return colors;
}