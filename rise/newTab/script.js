const nightColor = "#070B34";
const sunriseColor = "#7b95b6";
const dayColor = "#87ceeb";
const sunsetColor = "#FF5677";
const sunriseGradient = getColorGradient([nightColor, sunriseColor, dayColor], 60); // starts at 6:01 am - ends at 7:00 am
const sunsetGradient = getColorGradient([dayColor, sunsetColor, nightColor], 60); // starts at 8:01 pm - ends at 9:00 pm

window.onload = function () {
    updateTime();
    updateGreeting();
    updateWeather();
    updateBackground();
};

function updateTime() {
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
    navigator.geolocation.getCurrentPosition((position) => {

        fetch(
            "https://api.openweathermap.org/data/2.5/weather?lat=" +
            position.coords.latitude +
            "&lon=" +
            position.coords.longitude +
            "&appid=0fc2f3683a745d582fa88d28c3d85107&units=imperial"
        )
            .then((response) => response.json())
            .then((data) => {
                const temperature = Math.trunc(data.main.temp);
                const weatherCondition = data.weather[0].main;
                document.getElementById("temperature").textContent = temperature + "°F";
                document.getElementById("weatherCondition").textContent = weatherCondition;
                document.getElementById("divider").textContent = "|"
            })
    });
};

setInterval(updateTime, 10);
setInterval(updateGreeting, 60000);
setInterval(updateWeather, 1200000);

function updateBackground() {
    const skyElements = document.getElementsByClassName("sky");
    const sun = document.getElementById("sun");
    const moon = document.getElementById("moon");

    const sunMoonX = 110;

    for (let i = 0; i < skyElements.length; i++) {
        skyElements.item(i).style.fill = nightColor;
    }

    sun.setAttribute("transform", "translate(" + sunMoonX + "," + getSunPosition() + ")");
    moon.setAttribute("transform", "translate(" + sunMoonX + "," + getMoonPosition() + ")");
};


// TODO combine these more concisely
// sun & moon height based on cos(πx / 720), where x is the minutes after midnight
function getSunPosition() {
    const sunMoonPeak = 30;
    const date = new Date();
    const minutesPastMidnight = date.getHours() * 60 + date.getMinutes();
    console.log(minutesPastMidnight);
    return 60 * Math.cos(Math.PI * minutesPastMidnight / 720) + 90;
}

function getMoonPosition() {
    const sunMoonPeak = 30;
    const date = new Date();
    const minutesPastMidnight = date.getHours() * 60 + date.getMinutes();
    return -60 * Math.cos(Math.PI * minutesPastMidnight / 720) + 90;
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
