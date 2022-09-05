window.onload = function () {
    updateTime();
    updateGreeting();
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

    document.getElementById("clockNumbers").textContent = "" + hour + ":" + minuteString;
    document.getElementById("clockTimeOfDay").textContent = timeSuffix;
}

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
}

updateWeather = function () {

}

setInterval(updateTime, 10);
setInterval(updateGreeting, 1000);
setInterval(updateWeather, 20000);
