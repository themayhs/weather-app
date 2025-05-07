statusCelsius = true;
defaultCity = "Toulouse"
sunUp = true;

function imageByWeatherCode(code) {
    const directory = "assets_weather/large_icons"
    if (code >= 0 && code <= 1) {
        return `${directory}/sun_large.png`;
    } else if (code >= 2 && code <= 3) {
        return `${directory}/sun_cloud_large.png`;
    } else if (code >= 51 && code <= 57) {
        return `${directory}/cloud_large.png`;
    } else if (code >= 61 && code <= 67 || code >= 80 && code <= 82) {
        return `${directory}/rain_large.png`;
    } else if (code >= 71 && code <= 77 || code >= 85 && code <= 86) {
        return `${directory}/snow_large.png`;
    } else if (code >= 95 && code <= 99) {
        return `${directory}/thunder_large.png`;
    }
    return "Invalid code provided";
}

function formattingCityName(city) {
    return city[0].toUpperCase() + city.substring(1).toLowerCase();
}

function backgroundByWeatherCode(code) {
    const directory = "assets_weather/backgrounds"
    if (sunUp) {
        if (code >= 0 && code <= 1) {
            return "linear-gradient(#F2E3D3 65%,#E15F45 100%)";
        } else if (code >= 2 && code <= 3) {
            return "linear-gradient(#E2E2E2 65%,#B8513C 100%)";
        } else if (code >= 51 && code <= 57) {
            return "linear-gradient(#6D6D6D 30%,#EFEFEF 100%)";
        } else if (code >= 61 && code <= 67 || code >= 80 && code <= 82) {
            return "linear-gradient(#3B6493 30%,#F0F0F0 100%)";
        } else if (code >= 71 && code <= 77 || code >= 85 && code <= 86) {
            return "linear-gradient(#B1CDE4 55%,#D5D5D5 100%)";
        } else if (code >= 95 && code <= 99) {
            return "linear-gradient(#F8E564 65%,#92A1B3 100%)";
        }
        return "linear-gradient(#3B6493,#001F43)";
    }
    //`linear-gradient(${c1} 65%, ${c2} 100%)`
    return "Invalid code provided";
}

function displayInfo(city, data) {
    console.log(data);
    const temperature = data.current_weather.temperature;
    document.getElementById("city-name").innerHTML = formattingCityName(city);
    document.getElementById("temperature").innerHTML = temperature;

    // min max temperatures
    document.getElementById("max-temperature").innerHTML = data.daily.temperature_2m_max[0];
    document.getElementById("min-temperature").innerHTML = data.daily.temperature_2m_min[0];

    const weatherCode = data.current_weather.weathercode;
    console.log(weatherCode);
    document.getElementById("img-weather-status").src = imageByWeatherCode(weatherCode);

    // changing the background according to the weather
    document.body.style.background = backgroundByWeatherCode(weatherCode);

    document.getElementById("search-input").textContent = "";
}

function getValueConvert(temperature) {
    if (statusCelsius) {
        // changing image
        document.getElementById("img-unit-temperature").src = "images/fahrenheit.png"
        return Math.round((temperature * 9 / 5 + 32) * 10) / 10;
    } else {
        document.getElementById("img-unit-temperature").src = "images/celsius.png"
        return Math.round(((temperature - 32) * 5 / 9) * 10) / 10;
    }
}

function convertTemperature() {
        // changing temperature
        const element = document.getElementById("temperature");
        const temperature = +element.innerHTML;
        element.innerHTML = getValueConvert(temperature);
        // changing max and min
        const max = document.getElementById("max-temperature");
        max.innerHTML = getValueConvert(+max.innerHTML);
        const min = document.getElementById("min-temperature");
        min.innerHTML = getValueConvert(+min.innerHTML);
        // changing hourly temperatures
        for (let i = 1; i <= 24; i++) {
            const curr = document.getElementById(`h${i}-temperature`);
            const currTemp = +curr.innerHTML;
            curr.innerHTML = getValueConvert(currTemp);
        }
        // changing forecast
        for (let i = 1; i < 7; i++) {
            const curr2 = document.getElementById(`d${i}-temperature`);
            const currTemp2 = +curr2.innerHTML;
            curr2.innerHTML = getValueConvert(currTemp2);
        }

        statusCelsius = statusCelsius ? false : true;
}

async function getCoordinates(city) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.length === 0) throw new Error("The city has not been found");
    return {
        lat: data[0].lat,
        lon: data[0].lon
    };
}

async function getWeather() {
    let city = document.getElementById("search-input").value;
    if (city) {
        document.getElementById("search-input").value = "";
    } else {
        city = defaultCity;
    }

    const {lat, lon} = await getCoordinates(city);
    const urlTemp = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode,sunrise,sunset&timezone=auto&current_weather=true`;
    const temp = await fetch(urlTemp);
    const data = await temp.json();

    displayInfo(city, data);
    await getHourlyWeather(lat, lon);
    await getWeatherForecast(lat, lon);
}

async function getHourlyWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weather_code&timezone=auto&current_weather=true`;
    const temp = await fetch(url);
    const data = await temp.json();

    const localHourISO = data.current_weather.time.slice(0, 13);

    const indexNow = data.hourly.time.findIndex(t => t.startsWith(localHourISO));
    const next24Hours = data.hourly.temperature_2m.slice(indexNow, indexNow + 24);
    const weatherCodes24 = data.hourly.weather_code.slice(indexNow, indexNow + 25);

    for (let i = 1; i <= 24; i++) {
        document.getElementById(`h${i}-hour`).innerHTML = (indexNow + i - 1) % 24 + " h";
        document.getElementById(`h${i}-temperature`).innerHTML = next24Hours[i - 1];
        const pathImg = imageByWeatherCode(+weatherCodes24[i]);
        document.getElementById(`h${i}-img`).src = pathImg;
    }
}

async function getWeatherForecast(lat, lon) {
    const urlTemp = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
    const temp = await fetch(urlTemp);
    const data = await temp.json();
    const weather_code = data.daily.weathercode;
    const temperature = data.daily.temperature_2m_max;
    const days = ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"];
    const today = new Date();
    const idxDay = today.getDay();

    // next day
    document.getElementById("d1-day").innerHTML = "Next";
    document.getElementById("d1-img").src = imageByWeatherCode(weather_code[1]);
    document.getElementById("d1-temperature").innerHTML = temperature[1];

    for (let i = 2; i < 7; i++) {
        document.getElementById(`d${i}-day`).innerHTML = days[(idxDay + i) % 7];
        document.getElementById(`d${i}-img`).src = imageByWeatherCode(weather_code[i]);
        document.getElementById(`d${i}-temperature`).innerHTML = temperature[i];
    }
}

// searching button
const btnSearch = document.getElementById("button-start-search");
btnSearch.addEventListener("click",() => getWeather());

/* // convert button to celsius/fahrenheit
const btnCelsius = document.getElementById("img-unit-temperature");
btnCelsius.addEventListener("click",() => convertTemperature()); */

getWeather();
