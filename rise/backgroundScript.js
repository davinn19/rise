// function fetchWeather() {
//     console.log("yo");
//     navigator.geolocation.getCurrentPosition((position) => {

//         fetch(
//             "https://api.openweathermap.org/data/2.5/weather?lat=" +
//             position.coords.latitude +
//             "&lon=" +
//             position.coords.longitude +
//             "&appid=0fc2f3683a745d582fa88d28c3d85107&units=imperial"
//         )
//         .then((response) => response.json())
//         .then((data) => {
//             console.log(data);
//             const temp = Math.trunc(data.main.temp);
//             const weatherCondition = data.weather[0].main;
//             const sunrise = Date(data.sys.sunrise);
//             const sunriseMins = sunrise.getHours() * 60 + sunrise.getMinutes();
//             const sunset = Date(data.sys.sunrise);
//             const sunsetMins = sunset.getHours() * 60 + sunset.getMinutes();
//             const dateFetched = Date(data.dt).getDay();
            
//             localStorage.setItem("temp", temp);
//             localStorage.setItem("weatherCondition", + weatherCondition);
//             localStorage.setItem("sunriseMins", sunriseMins);
//             localStorage.setItem("sunsetMins", sunsetMins);
//             localStorage.setItem("dateFetched", dateFetched);

//         })
//     })
// }

// console.log("yay");
// // fetchWeather();

// // browser.alarms.onAlarm.addListener(fetchWeather);
// // browser.alarms.create("fetchWeather", {periodInMinutes: 20});

browser.alarms.onAlarm.addListener(() => {console.log("yes")});
browser.alarms.create("test", {periodInMinutes : 1})

browser.tabs.onCreated.addListener(() => {console.log("no")});

browser.runtime.onInstalled.addListener(() => {
    console.log("yo");
  });
