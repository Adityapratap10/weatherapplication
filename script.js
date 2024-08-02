const inputBox = document.querySelector('.input-box');
const searchBtn = document.getElementById('searchBtn');
const weather_img = document.querySelector('.weather-img');
const temperature = document.querySelector('.temperature');
const description = document.querySelector('.description');
const humidity = document.getElementById('humidity');
const wind_speed = document.getElementById('wind-speed');
const location_not_found = document.querySelector('.location-not-found');
const weather_body = document.querySelector('.weather-body');
const alertBox = document.getElementById('alertBox');
const includeNearbySection = document.getElementById('includeNearbySection');
const downloadReportBtn = document.getElementById('downloadReportBtn');
const nearbyCities = document.getElementById('nearbyCities');
const citiesTableBody = document.getElementById('citiesTableBody');

const api_key = "3e89ec6b52d17a609f5902fc4730510b";

async function checkWeather(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${api_key}`;
    const weather_data = await fetch(url).then(response => response.json());

    if (weather_data.cod === '404') {
        location_not_found.style.display = "flex";
        weather_body.style.display = "none";
        includeNearbySection.style.display = "none";
        downloadReportBtn.style.display = "none";
        return;
    }

    location_not_found.style.display = "none";
    weather_body.style.display = "flex";
    temperature.innerHTML = `${Math.round(weather_data.main.temp - 273.15)}°C`;
    description.innerHTML = `${weather_data.weather[0].description}`;
    humidity.innerHTML = `${weather_data.main.humidity}%`;
    wind_speed.innerHTML = `${weather_data.wind.speed} Km/H`;

    switch (weather_data.weather[0].main) {
        case 'Clouds':
            weather_img.src = "/assets/cloud.png";
            break;
        case 'Clear':
            weather_img.src = "/assets/clear.png";
            break;
        case 'Rain':
            weather_img.src = "/assets/rain.png";
            break;
        case 'Mist':
            weather_img.src = "/assets/mist.png";
            break;
        case 'Snow':
            weather_img.src = "/assets/snow.png";
            break;
    }

    let alertMessages = [];
    if (weather_data.wind.speed > 10) {
        alertMessages.push("High wind speed!");
    }
    if (weather_data.weather[0].main === "Rain" && weather_data.rain && weather_data.rain['1h'] > 10) {
        alertMessages.push("Heavy rainfall!");
    }
    if (weather_data.main.humidity > 90) {
        alertMessages.push("High humidity!");
    }

    if (alertMessages.length > 0) {
        showAlert(alertMessages.join(" "));
    } else {
        alertBox.style.display = "none";
    }

    includeNearbySection.style.display = "block";
    downloadReportBtn.style.display = "block";

    fetchNearbyCitiesWeather(weather_data.coord.lat, weather_data.coord.lon);
}

function showAlert(message) {
    alertBox.innerHTML = message;
    alertBox.style.display = "block";
}

async function fetchNearbyCitiesWeather(lat, lon) {
    const radius = 50;  
    const url = `https://api.openweathermap.org/data/2.5/find?lat=${lat}&lon=${lon}&cnt=10&appid=${api_key}&units=metric`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.cod !== "200") {
        console.error("Error fetching nearby cities");
        return;
    }

    citiesTableBody.innerHTML = data.list.map(city => `
        <tr>
            <td>${city.name}</td>
            <td>${Math.round(city.main.temp)}°C</td>
            <td>${city.weather[0].description}</td>
        </tr>
    `).join('');
    nearbyCities.style.display = "block";
}

function generateWeatherReport(mainCity, nearbyCities = []) {
    const now = new Date();
    const dateString = now.toLocaleDateString();
    const timeString = now.toLocaleTimeString();

    let report = `<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">`;
    report += `<tr><th colspan="2">Weather Report for ${mainCity.name}</th></tr>`;
    report += `<tr><td>Date</td><td>${dateString}</td></tr>`;
    report += `<tr><td>Time</td><td>${timeString}</td></tr>`;
    report += `<tr><td>Temperature</td><td>${mainCity.temp}°C</td></tr>`;
    report += `<tr><td>Description</td><td>${mainCity.description}</td></tr>`;
    report += `<tr><td>Humidity</td><td>${mainCity.humidity}%</td></tr>`;
    report += `<tr><td>Wind Speed</td><td>${mainCity.windSpeed} Km/H</td></tr>`;

    if (nearbyCities.length > 0) {
        report += `<tr><th colspan="2">Nearby Cities Weather</th></tr>`;
        nearbyCities.forEach(city => {
            report += `<tr><td colspan="2">${city.name}</td></tr>`;
            report += `<tr><td>Temperature</td><td>${city.temp}°C</td></tr>`;
            report += `<tr><td>Description</td><td>${city.description}</td></tr>`;
        });
    }

    report += `</table>`;
    return report;
}

function downloadReport(filename, content) {
    const element = document.createElement('a');
    const file = new Blob([content], {type: 'text/html'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element); 
    element.click();
}

searchBtn.addEventListener('click', async () => {
    await checkWeather(inputBox.value);
});

downloadReportBtn.addEventListener('click', () => {
    const mainCityWeather = {
        name: inputBox.value,
        temp: Math.round(parseFloat(temperature.textContent)), 
        description: description.textContent,
        humidity: parseInt(humidity.textContent.replace('%', '')),
        windSpeed: parseFloat(wind_speed.textContent.replace(' Km/H', ''))
    };

    let nearbyCitiesWeather = [];
    if (document.getElementById('includeNearbyCities').checked) {
        const rows = citiesTableBody.querySelectorAll('tr');
        nearbyCitiesWeather = Array.from(rows).map(row => {
            const cells = row.querySelectorAll('td');
            return {
                name: cells[0].textContent,
                temp: parseFloat(cells[1].textContent.replace('°C', '')),
                description: cells[2].textContent
            };
        });
    }

    const report = generateWeatherReport(mainCityWeather, nearbyCitiesWeather);
    downloadReport('Weather_Report.html', report);
});
