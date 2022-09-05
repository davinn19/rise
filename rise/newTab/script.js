window.onload = function () {
    updateTime();
    updateGreeting();
    updateWeather();
};

updateTime = function () {
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

updateGreeting = function () {
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

updateWeather = function () {
    navigator.geolocation.getCurrentPosition((position) => {

        fetch(
            "https://api.openweathermap.org/data/2.5/weather?lat=" +
                position.coords.latitude +
                "&lon=" +
                position.coords.longitude +
                "&appid=0fc2f3683a745d582fa88d28c3d85107&units=imperial"
        )
        .then((response) => response.json())
        .then((data) => 
        {
            const temperature = Math.trunc(data.main.temp);
            const weatherCondition = data.weather[0].main;
            document.getElementById("temperature").textContent = temperature + "°F";
            document.getElementById("weatherCondition").textContent = weatherCondition;
            document.getElementById("divider").textContent = "|"
        })

        // const temperature = weatherData.current.temp;
        // const weatherCondition = weatherData.current.weather.main;

        // document.getElementById(temperature).textContent = temperature + "°F";
        // console.log(temperature);
        // console.log(weatherCondition);
        
    });
};

setInterval(updateTime, 10);
setInterval(updateGreeting, 60000);
setInterval(updateWeather, 1200000);
