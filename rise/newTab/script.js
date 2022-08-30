window.onload = function () {
    updateTime();

    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Hello", canvas.clientWidth / 2, canvas.clientHeight / 2);
};

updateTime = function () {
    const date = new Date();

    let hour = date.getHours();
    const minute = date.getMinutes();

    let timeSuffix;
    if (hour < 12) {
        timeSuffix = "AM";
    } else {
        timeSuffix = "PM";
    }

    if (hour == 0) {
        hour = 12;
    } else if (hour > 12) {
        hour -= 12;
    }

    document.getElementById("clock").textContent =
        "" + hour + ":" + minute + " " + timeSuffix;
};

updateScreen = function() {
    updateTime();
}

interval = setInterval(updateScreen, 10);