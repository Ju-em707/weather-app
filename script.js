let currentWeatherData = null;
let currentLocation = { lat: 40.71278, lon: -74.00594, name: "New York, United States" };

let toCelsius = true;
let toKmh = true;
let toMm = true;

let isMetric = true;
let isImperial = false;

let startDayIndex = 0;
const daysIndexIncrement = [0, 24, 48, 72, 96, 120, 144];

const mainSection = document.getElementById("main-section");
const apiErrorState = document.getElementById("api-error-state");


// IP API fetch

async function fetchCurrentLocationData() {
    try {
        // add Access-Control-Allow-Origin header from proxy
        const response = await fetch('api/location.js');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        return {
            latitude: data.latitude,
            longitude: data.longitude,
            city: data.city || "New York",
            country: data.country || "United States"
        };
        
    } catch (error) {
        console.error("Error fetching location:", error);
        showAPIError("Unable to search for current location. Please try again.");

        return {
            latitude: currentLocation.lat,
            longitude: currentLocation.lon,
            city: "New York",
            country: "United States"
        };
    }
}



async function fetchLocations(query) {
    try {
        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const results = data.results;

        return results || [];

    } catch (error) {
        console.error("Error fetching location:", error);
        showAPIError("Unable to search for locations. Please try again.");
        return [];
    }
}

async function fetchWeatherData(lat, lon) {
    try {
        const url = new URL("https://api.open-meteo.com/v1/forecast");
        url.searchParams.append("latitude", lat);
        url.searchParams.append("longitude", lon);
        url.searchParams.append("current", "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m");
        url.searchParams.append("hourly", "temperature_2m,weather_code");
        url.searchParams.append("daily", "weather_code,temperature_2m_max,temperature_2m_min");
        url.searchParams.append("temperature_unit", "celsius");
        url.searchParams.append("wind_speed_unit", "kmh");
        url.searchParams.append("precipitation_unit", "mm");
        url.searchParams.append("timezone", "auto");
        url.searchParams.append("forecast_days", "7");

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
        
    } catch (error) {
        console.error("Error fetching weather:", error);
        showAPIError("Unable to fetch weather data. Please try again.");
        return null;
    }
}

function getWeatherIcon(code) {
    const weatherMap = {
        0: { icon: "icon-sunny.webp", description: "Clear sky" },
        1: { icon: "icon-sunny.webp", description: "Mainly clear" },
        2: { icon: "icon-partly-cloudy.webp", description: "Partly cloudy" },
        3: { icon: "icon-overcast.webp", description: "Overcast" },
        45: { icon: "icon-fog.webp", description: "Foggy" },
        48: { icon: "icon-fog.webp", description: "Foggy" },
        51: { icon: "icon-drizzle.webp", description: "Light drizzle" },
        53: { icon: "icon-drizzle.webp", description: "Moderate drizzle" },
        55: { icon: "icon-drizzle.webp", description: "Dense drizzle" },
        61: { icon: "icon-rain.webp", description: "Slight rain" },
        63: { icon: "icon-rain.webp", description: "Moderate rain" },
        65: { icon: "icon-rain.webp", description: "Heavy rain" },
        71: { icon: "icon-snow.webp", description: "Slight snow" },
        73: { icon: "icon-snow.webp", description: "Moderate snow" },
        75: { icon: "icon-snow.webp", description: "Heavy snow" },
        77: { icon: "icon-snow.webp", description: "Snow grains" },
        80: { icon: "icon-rain.webp", description: "Slight rain showers" },
        81: { icon: "icon-rain.webp", description: "Moderate rain showers" },
        82: { icon: "icon-rain.webp", description: "Violent rain showers" },
        85: { icon: "icon-snow.webp", description: "Slight snow showers" },
        86: { icon: "icon-snow.webp", description: "Heavy snow showers" },
        95: { icon: "icon-storm.webp", description: "Thunderstorm" },
        96: { icon: "icon-storm.webp", description: "Thunderstorm with hail" },
        99: { icon: "icon-storm.webp", description: "Thunderstorm with hail" }
    };

    return weatherMap[code] || { icon: "icon-sunny.webp", description: "Unknown" };
}


// UI updates

function updateCurrentWeather(data) {
    const current = data.current;
    
    document.getElementById("card-info__location-name").textContent = currentLocation.name;
    document.getElementById("card-info__current-date").textContent = formatDate(current.time);

    document.getElementById("temperature").textContent = `${getConvertedTemperature(current.temperature_2m)}°`;

    const weatherInfo = getWeatherIcon(current.weather_code);
    document.querySelector(".icon-weather").src = `assets/images/${weatherInfo.icon}`;
    document.querySelector(".icon-weather").alt = `${weatherInfo.description}`;

    const feelsLikeTemp = getConvertedTemperature(current.apparent_temperature);

    const windSpeed = getConvertedWindSpeed(current.wind_speed_10m);
    const windSpeedUnit = toKmh ? 'km/h' : 'mph';

    const precipitation = getConvertedPrecipitation(current.precipitation);
    const precipUnit = toMm ? 'mm' : 'in';


    document.querySelectorAll(".stat__value")[0].textContent = `${feelsLikeTemp}°`;
    document.querySelectorAll(".stat__value")[1].textContent = `${current.relative_humidity_2m}%`;
    document.querySelectorAll(".stat__value")[2].textContent = `${windSpeed} ${windSpeedUnit}`;
    document.querySelectorAll(".stat__value")[3].textContent = (precipitation >= 0.00 && precipitation <= 0.40) ? `0 ${precipUnit}` : `${precipitation} ${precipUnit}`;
}

function updateDailyForecast(data) {
    const daily = data.daily;

    const forecastContainer = document.getElementById("daily-forecast");
    forecastContainer.innerHTML = "";

    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 0; i < daily.time.length; i++) {
        // ensure local time zone of current location
        // avoid automatic UTC conversion of date-only string
        const date = new Date(daily.time[i] + "T00:00Z");
        const dayName = daysOfWeek[date.getUTCDay()] ?? "Unknown";
        console.log(date.getUTCDay());
        const weatherInfo = getWeatherIcon(daily.weather_code[i]);

        const dayCard = document.createElement("article");
        dayCard.className = "day-card";
        dayCard.innerHTML = `
            <p class="day">${dayName}</p>
              <img
                src="assets/images/${weatherInfo.icon}"
                alt="${weatherInfo.description}"
                class="icon-day"
              />
              <div class="temps-container">
                <p class="temp__val">${getConvertedTemperature(daily.temperature_2m_max[i])}°</p>
                <p class="temp__val">${getConvertedTemperature(daily.temperature_2m_min[i])}°</p>
              </div>
        `;
        
        forecastContainer.appendChild(dayCard);
    }
}

function updateHourlyForecast(data) {
    const hourly = data.hourly;
    const hourlyList = document.getElementById("hourly-list");
    hourlyList.innerHTML = "";


    // deal directly with strings to avoid local computer
    // time zone conversion
    let currentIndex = hourly.time.findIndex(t => t.startsWith(data.current.time.slice(0, 13)));

    if (startDayIndex > 0) {
        currentIndex = daysIndexIncrement[startDayIndex];
    }
        
    console.log(currentIndex);
    if (currentIndex === -1) currentIndex = 0;

    const hoursToShow = Math.min(24, hourly.time.length - currentIndex);

    for (let i = 0; i < hoursToShow; i++) {
        const index = currentIndex + i;

        // direct access to avoid conversion
        const hourTimestamp = hourly.time[index];
        const hour = parseInt(hourTimestamp.split('T')[1].split(':')[0]);

        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 === 0 ? 12 : hour % 12;

        const weatherInfo = getWeatherIcon(hourly.weather_code[index]);
        const temp = getConvertedTemperature(hourly.temperature_2m[index]);

        const hourlyRow = document.createElement("li");
        hourlyRow.className = "hourly-row";
        hourlyRow.innerHTML = `
            <img
                src="assets/images/${weatherInfo.icon}"
                alt="${weatherInfo.description}"
                class="icon-hourly"
              />
              <span class="hour">${displayHour} ${ampm}</span>
              <span class="temp">${temp}°</span>
        `;

        hourlyList.appendChild(hourlyRow);
    }
}

function updateHourlyDaysDropdown(data) {
    const daily = data.daily;

    const dayToggle = document.getElementById("day-toggle");
    dayToggle.innerHTML = "";

    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];


    const dayButtons = document.querySelectorAll(".day-dropdown > .dropdown__option");

    dayButtons.forEach((dayBtn) => {
        dayBtn.classList.remove("marked");
    });
    dayButtons[0].classList.add("marked");
    startDayIndex = 0;


    let toggleName = "Unknown";
    for (let i = 0; i < daily.time.length; i++) {
        const date = new Date(daily.time[i] + "T00:00Z");
        const dayName = daysOfWeek[date.getUTCDay()] ?? "Unknown";
        if (i === 0) {
            toggleName = dayName;
        }
        
        dayButtons[i].innerHTML = `
            ${dayName}
            <img
                src="assets/images/icon-checkmark.svg"
                alt="Checkmark icon"
                class="icon-checkmark"
            />
        `;

        dayButtons[i].addEventListener("click", () => {
            startDayIndex = i;
            updateHourlyForecast(currentWeatherData);
            dayToggle.innerHTML = `
                ${dayName}
                <img
                    src="assets/images/icon-dropdown.svg"
                    alt="Dropdown-icon"
                    class="icon-dropdown"
                />
            `;

            dayButtons.forEach((dayBtn) => {
                dayBtn.classList.remove("marked");
            });

            dayButtons[i].classList.add("marked");

        });

    }

    dayToggle.innerHTML = `
        ${toggleName}
        <img
            src="assets/images/icon-dropdown.svg"
            alt="Dropdown-icon"
            class="icon-dropdown"
        />
    `;
}


// Unit Conversion

const generalUnitBtn = document.getElementById("general-unit-btn");
const celsiusBtn = document.getElementById("btn-temp__celsius");
const fahrenheitBtn = document.getElementById("btn-temp__fahrenheit");
const kmhBtn = document.getElementById("btn-wind-speed__kmh");
const mphBtn = document.getElementById("btn-wind-speed__mph");
const mmBtn = document.getElementById("btn-precipitation__millimeters");
const inchesBtn = document.getElementById("btn-precipitation__inches");


function renderAllWeather(data) {
    switchGeneralUnitLabel();

    setLoadingState(false);

    updateCurrentWeather(data);
    updateDailyForecast(data);
    updateHourlyDaysDropdown(data);
    updateHourlyForecast(data);
}

function switchGeneralUnitLabel() {
    if (toCelsius === false &&
        toKmh === false &&
        toMm === false
    ) {
        isMetric = false;
        isImperial = true;
        generalUnitBtn.textContent = "Switch to Metric";

    } else if (toCelsius === true &&
        toKmh === true &&
        toMm === true
    ) {
        isMetric = true;
        isImperial = false;
        generalUnitBtn.textContent = "Switch to Imperial";
    }
}


generalUnitBtn.addEventListener("click", () => {
    if (isMetric) {
        convertToFahrenheit();
        convertToMph();
        convertToInches();
    } else if (isImperial) {
        convertToCelsius();
        convertToKmh();
        convertToMm();
    }
    renderAllWeather(currentWeatherData);
});


celsiusBtn.classList.add("marked");
kmhBtn.classList.add("marked");
mmBtn.classList.add("marked");

celsiusBtn.addEventListener("click", () => {
    convertToCelsius();
    convertTemperature();
});

function convertToCelsius() {
    if (toCelsius) {
        return;
    }
    celsiusBtn.classList.add("marked");
    fahrenheitBtn.classList.remove("marked");
    
    toCelsius = true;
}


fahrenheitBtn.addEventListener("click", () => {
    convertToFahrenheit();
    convertTemperature();
});

function convertToFahrenheit() {
    if (!toCelsius) {
        return;
    }
    fahrenheitBtn.classList.add("marked");
    celsiusBtn.classList.remove("marked");
    toCelsius = false;
}


kmhBtn.addEventListener("click", () => {
    convertToKmh();
    convertWindSpeed();
});

function convertToKmh() {
    if (toKmh) {
        return;
    }
    kmhBtn.classList.add("marked");
    mphBtn.classList.remove("marked");
    toKmh = true;
}


mphBtn.addEventListener("click", () => {
    convertToMph();
    convertWindSpeed();
});

function convertToMph() {
    if (!toKmh) {
        return;
    }
    mphBtn.classList.add("marked");
    kmhBtn.classList.remove("marked");
    toKmh = false;
}


mmBtn.addEventListener("click", () => {
    convertToMm();
    convertPrecipitation();
});

function convertToMm() {
    if (toMm) {
        return;
    }
    mmBtn.classList.add("marked");
    inchesBtn.classList.remove("marked");
    toMm = true;
}


inchesBtn.addEventListener("click", () => {
    convertToInches();
    convertPrecipitation();
});

function convertToInches() {
    if (!toMm) {
        return;
    }
    inchesBtn.classList.add("marked");
    mmBtn.classList.remove("marked");
    toMm = false;
}



function convertTemperature() {

    renderAllWeather(currentWeatherData);
}

function convertWindSpeed() {

    switchGeneralUnitLabel();
    updateCurrentWeather(currentWeatherData);
}

function convertPrecipitation() {
    
    switchGeneralUnitLabel();
    updateCurrentWeather(currentWeatherData);
}



function getConvertedTemperature(temp) {
    if (toCelsius === false) {
        return Math.round((temp * 1.8) + 32);
    }

    return Math.round(temp);
}

function getConvertedWindSpeed(windSpeed) {
    if (toKmh === false) {
        return Math.round(windSpeed * 0.621371);
    }

    return Math.round(windSpeed);
}

function getConvertedPrecipitation(precip) {
    if (toMm === false) {
        return (precip / 25.4).toFixed(2);
    }

    return precip.toFixed(2);
}



// Dropdowns

const searchBarToggle = document.querySelector(".js-search-bar-toggle");

const unitToggle = document.querySelector(".js-unit-toggle");
const unitDropdown = document.querySelector(".unit-dropdown");
const dayToggle = document.querySelector(".js-day-toggle");
const dayDropdown = document.querySelector(".day-dropdown");

searchBarToggle.addEventListener("click", (event) => {
    
    event.stopPropagation();

    if (searchDropdown.classList.contains("open") || 
        searchInput.value.length < 2) {
        return;
    }

    searchDropdown.classList.add("open");
    unitDropdown.classList.remove("open");
    dayDropdown.classList.remove("open");
});

unitToggle.addEventListener("click", (event) => {
    
    event.stopPropagation();
    unitDropdown.classList.toggle("open");
    searchDropdown.classList.remove("open");
    dayDropdown.classList.remove("open");
});

dayToggle.addEventListener("click", (event) => {
    
    event.stopPropagation();
    dayDropdown.classList.toggle("open");
    searchDropdown.classList.remove("open");
    unitDropdown.classList.remove("open");
});

document.addEventListener("click", (event) => {
    const clickedOutsideSearchBar = !searchDropdown.contains(event.target);
    const clickedOutsideUnit = !unitDropdown.contains(event.target);
    const clickedOutsideDay = !dayDropdown.contains(event.target);

    if (clickedOutsideSearchBar && clickedOutsideUnit && clickedOutsideDay) {
        searchDropdown.classList.remove("open");
        unitDropdown.classList.remove("open");
        dayDropdown.classList.remove("open");
    }
});



// Search Functionality

const searchInput = document.querySelector('input[type="search"]');
const searchDropdown = document.querySelector(".search-dropdown");
const searchButton = document.querySelector(".btn-search");

const dashboard = document.getElementById("dashboard");
const noResultsDisplay = document.getElementById("no-results-display");

const searchBarPopUpWarning = document.getElementById("warning-pop-up");


let query = '';
let searchTimeout;
let suggestions = [];
let focusedIndex = -1;
searchInput.addEventListener("input", async (event) => {
    query = event.target.value.trim();

    clearTimeout(searchTimeout);

    if (query.length < 2) {
        searchDropdown.classList.remove("open");
        return;
    }

    searchBarPopUpWarning.classList.remove("show");

    searchTimeout = setTimeout(async () => {
        setSearchingState(true);
        const locations = await fetchLocations(query);
        suggestions = Array.from(displayLocationSuggestions(locations).querySelectorAll(".js-city-suggestion"));

    }, 300);
});


searchInput.addEventListener("keydown", async (event) => {

    if (suggestions.length === 0 && event.key !== 'Enter') return;

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
    }

    switch (event.key) {
        case 'ArrowUp': 
            if (searchInput.value.length < 2) return;
            if (focusedIndex === 0) {
                backToOriginalQuery();
                return;
            }
            
            if (focusedIndex === -1) focusedIndex = 0;
            focusedIndex = (focusedIndex - 1 + suggestions.length) % suggestions.length;
            
            updateSuggestions();
            break;
        

        case 'ArrowDown': 
            if (searchInput.value.length < 2) return;
            if (focusedIndex === suggestions.length - 1) {
                backToOriginalQuery();
                return;
            }
            focusedIndex = (focusedIndex + 1) % suggestions.length;
            updateSuggestions();
            break;
        

        case 'Enter': 
            if (focusedIndex >= -1) {
                event.preventDefault();
                hideSuggestions();
                await searchLocation();
            }
            break;
        

        case 'Escape': 
            hideSuggestions();
            break;
        
    }
});

function backToOriginalQuery() {
    suggestions[focusedIndex].classList.remove("active");
    focusedIndex = -1;
    searchInput.value = query;
}

function updateSuggestions() {
    suggestions.forEach((item) => {
        item.classList.remove("active");
    });

    const newFocusItem = suggestions[focusedIndex];

    newFocusItem.classList.add("active");
    newFocusItem.scrollIntoView({ block: 'nearest' });
    searchInput.value = suggestions[focusedIndex].textContent;
}

function hideSuggestions() {
    searchDropdown.classList.remove("open");
    searchInput.setAttribute('aria-expanded', 'false');
    focusedIndex = -1;
}

function displayLocationSuggestions(locations) {
    focusedIndex = -1;
    searchDropdown.innerHTML = "";

    if (locations.length === 0 || searchInput.value.length < 2) {
        searchDropdown.innerHTML = `<p style="padding: 0.5rem; font-size: 0.8rem;">No locations found</p>`;
        searchDropdown.classList.add("open");
        return;
    }

    locations.forEach(location => {
        const button = document.createElement("button");
        button.className = "dropdown__option btn-toggle js-city-suggestion";
        button.textContent = `${location.name}, ${location.country}`;

        button.addEventListener("click", async () => {
            currentLocation = {
                lat: location.latitude,
                lon: location.longitude,
                name: `${location.name}, ${location.country}`
            };

            searchInput.value = currentLocation.name;
            searchDropdown.classList.remove("open");

            await loadWeatherForCurrentLocation();
        });

        searchDropdown.appendChild(button);
    });

    searchDropdown.classList.add("open");

    return searchDropdown;
}


searchButton.addEventListener("click", async () => {
    await searchLocation();
});


async function searchLocation() {
    query = searchInput.value.trim();

    if (query === currentLocation.name) return;
    if (query.length < 2) {
        showSearchError("Enter a location.");
        shakeSearchError();
        return;
    }

    const locations = await fetchLocations(query);

    if (locations.length > 0) {
        currentLocation = {
            lat: locations[0].latitude,
            lon: locations[0].longitude,
            name: `${locations[0].name}, ${locations[0].country}`
        };

        searchInput.value = currentLocation.name;
        searchDropdown.classList.remove("open");

        await loadWeatherForCurrentLocation();

    } else {
        dashboard.style.display = "none";
        noResultsDisplay.style.display = "block";
    }
}




// Main

async function loadWeatherForCurrentLocation() {
    dashboard.style.opacity = 1;
    setLoadingState(true);
    dashboard.style.display = "flex";
    noResultsDisplay.style.display = "none";

    const data = await fetchWeatherData(currentLocation.lat, currentLocation.lon);
    console.log(data.current.time);
    console.log(data.hourly.time);

    if (data) {
        currentWeatherData = data;
        renderAllWeather(data);
    }
}


// API Error state (refresh)

const retryBtn = document.querySelector(".js-retry-button");

retryBtn.addEventListener("click", async () => {
    apiErrorState.style.display = "none";
    setLoadingState(true);

    await initWeatherApp();
});


// Loading state

const weatherCard = document.getElementById("weather-card");
const statValues = document.querySelectorAll(".stat__value");
const dayCards = document.querySelectorAll(".day-card");
const hourlyRows = document.querySelectorAll(".hourly-row");

function setLoadingState(loading) {
    animateLoadingWeatherCard(loading);
    animateLoadingWeatherStats();
    animateLoadingDailyForecast(loading);
    animateLoadingHourlyForecast(loading);
}

function animateLoadingWeatherCard(loading) {
    if (loading) {
        weatherCard.classList.add("loading");
    } else {
        weatherCard.classList.remove("loading");
    }
}

function animateLoadingWeatherStats() {
    statValues.forEach((stat) => {
        stat.textContent = "-";
    });
}

function animateLoadingDailyForecast(loading) {
    if (loading) {
        dayCards.forEach((dayCard) => {
        dayCard.classList.add("hidden");
        });
    } else {
        dayCards.forEach((dayCard) => {
        dayCard.classList.remove("hidden");
        });
    }
}

function animateLoadingHourlyForecast(loading) {
    if (loading) {
        dayToggle.innerHTML = `
            -
                <img
                src="assets/images/icon-dropdown.svg"
                alt="Dropdown-icon"
                class="icon-dropdown"
                />
        `;
        hourlyRows.forEach((row) => {
            row.classList.add("hidden");
        });
    } else {
        hourlyRows.forEach((row) => {
            row.classList.remove("hidden");
        });
    }
}


// Searching state

function setSearchingState(searching) {
    if (searching) {
        searchDropdown.innerHTML = `
        <div class="searching-state">
            <img
                src="assets/images/icon-loading.svg"
                alt="Loading icon"
                class="icon-search icon-loading"
            />
            <p style="padding: 0.5rem; font-size: 0.7rem;">Searching in progress</p>
        </div>
        `;
        
        searchDropdown.classList.add("open");
    }
}


// Utilities

function showAPIError(message) {
    mainSection.style.display = "none";
    apiErrorState.style.display = "flex";
    document.querySelector(".error-message").textContent = message;
}

function showSearchError(message) {
    searchInput.focus();

    searchBarPopUpWarning.innerHTML = `
        <img
            src="assets/images/warning-icon.webp"
            alt="Warning icon"
            class="icon-warning"
        />
        ${message}
    `;

    
    searchBarPopUpWarning.classList.add("show");

    searchInput.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
    });
}

function shakeSearchError() {
    searchBarPopUpWarning.classList.remove("shake");
    void searchBarPopUpWarning.offsetWidth;
    searchBarPopUpWarning.classList.add("shake");
}

function formatDate(dateStr) {
    const date = new Date(dateStr.includes('Z') ? dateStr : dateStr + "Z");

    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
    };
    return date.toLocaleDateString('en-US', options);
}


document.addEventListener("DOMContentLoaded", async () => {
    await initWeatherApp();
});

async function initWeatherApp() {
    const data = await fetchCurrentLocationData();

    currentLocation = {
        lat: data.latitude,
        lon: data.longitude,
        name: `${data.city}, ${data.country}`
    };

    await loadWeatherForCurrentLocation();
}