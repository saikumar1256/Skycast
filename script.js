const form = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const message = document.getElementById("message");
const weatherPanel = document.getElementById("weatherPanel");

const geocodingURL = "https://geocoding-api.open-meteo.com/v1/search";
const weatherURL = "https://api.open-meteo.com/v1/forecast";

const weatherTypes = {
    0: ["Clear Sky", "☀️"],
    1: ["Mainly Clear", "🌤️"],
    2: ["Partly Cloudy", "⛅"],
    3: ["Overcast", "☁️"],
    45: ["Foggy", "🌫️"],
    48: ["Rime Fog", "🌫️"],
    51: ["Light Drizzle", "🌦️"],
    53: ["Drizzle", "🌦️"],
    55: ["Heavy Drizzle", "🌧️"],
    56: ["Freezing Drizzle", "🌧️"],
    57: ["Freezing Drizzle", "🌧️"],
    61: ["Light Rain", "🌦️"],
    63: ["Moderate Rain", "🌧️"],
    65: ["Heavy Rain", "🌧️"],
    66: ["Freezing Rain", "🌧️"],
    67: ["Freezing Rain", "🌧️"],
    71: ["Light Snow", "🌨️"],
    73: ["Snow", "❄️"],
    75: ["Heavy Snow", "❄️"],
    77: ["Snow Grains", "🌨️"],
    80: ["Rain Showers", "🌦️"],
    81: ["Rain Showers", "🌧️"],
    82: ["Heavy Showers", "⛈️"],
    85: ["Snow Showers", "🌨️"],
    86: ["Heavy Snow Showers", "❄️"],
    95: ["Thunderstorm", "⛈️"],
    96: ["Thunderstorm with Hail", "⛈️"],
    99: ["Severe Thunderstorm", "⛈️"]
};

function getWeather(code) {
    return weatherTypes[code] || ["Weather Unavailable", "🌍"];
}

function showMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle("error", isError);
}

async function getJSON(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Weather service is temporarily unavailable.");
    }

    return response.json();
}

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (!city) {
        showMessage("Please enter a city name.", true);
        return;
    }

    searchBtn.disabled = true;
    searchBtn.textContent = "Searching...";
    showMessage("Getting the latest weather...");
    weatherPanel.hidden = true;

    try {
        // Step 1: Find the city coordinates
        const geoParams = new URLSearchParams({
            name: city,
            count: "1",
            language: "en",
            format: "json"
        });

        const geoData = await getJSON(
            `${geocodingURL}?${geoParams}`
        );

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error(
                "City not found. Please check the spelling and try again."
            );
        }

        const place = geoData.results[0];

        // Step 2: Get current weather and 5-day forecast
        const weatherParams = new URLSearchParams({
            latitude: place.latitude,
            longitude: place.longitude,
            current: [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "is_day",
                "weather_code",
                "cloud_cover",
                "wind_speed_10m"
            ].join(","),
            daily: [
                "weather_code",
                "temperature_2m_max",
                "temperature_2m_min"
            ].join(","),
            timezone: "auto",
            forecast_days: "5"
        });

        const data = await getJSON(
            `${weatherURL}?${weatherParams}`
        );

        if (!data.current || !data.daily) {
            throw new Error("Weather data is not available right now.");
        }

        displayWeather(place, data);
        showMessage("Weather updated successfully.");

    } catch (error) {
        showMessage(
            error.message || "Something went wrong. Please try again.",
            true
        );
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = "Search ↗";
    }
});

function displayWeather(place, data) {
    const current = data.current;
    const daily = data.daily;
    const [description, icon] = getWeather(current.weather_code);

    document.getElementById("cityName").textContent =
        `${place.name}, ${place.country || place.admin1 || ""}`;

    document.getElementById("temperature").textContent =
        Math.round(current.temperature_2m);

    document.getElementById("description").textContent =
        description;

    document.getElementById("weatherIcon").textContent = icon;

    document.getElementById("humidity").textContent =
        `${current.relative_humidity_2m}%`;

    document.getElementById("wind").textContent =
        `${Math.round(current.wind_speed_10m)} km/h`;

    document.getElementById("feelsLike").textContent =
        Math.round(current.apparent_temperature);

    document.getElementById("feelsCard").textContent =
        `${Math.round(current.apparent_temperature)}°C`;

    document.getElementById("clouds").textContent =
        `${current.cloud_cover}%`;

    const date = new Date(current.time);
    document.getElementById("dateText").textContent =
        date.toLocaleString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });

    displayForecast(daily);

    weatherPanel.hidden = false;
}

function displayForecast(daily) {
    const forecastContainer = document.getElementById("forecast");
    forecastContainer.replaceChildren();

    daily.time.forEach((dateString, index) => {
        const [description, icon] =
            getWeather(daily.weather_code[index]);

        const date = new Date(`${dateString}T12:00:00`);

        const dayName = index === 0
            ? "Today"
            : date.toLocaleDateString("en-US", {
                weekday: "short"
            });

        const card = document.createElement("article");
        card.className = "forecast-day";

        const day = document.createElement("p");
        day.className = "day";
        day.textContent = dayName;

        const weatherIcon = document.createElement("div");
        weatherIcon.className = "icon";
        weatherIcon.textContent = icon;
        weatherIcon.title = description;

        const max = document.createElement("p");
        max.className = "max";
        max.textContent =
            `${Math.round(daily.temperature_2m_max[index])}°`;

        const min = document.createElement("p");
        min.className = "min";
        min.textContent =
            `${Math.round(daily.temperature_2m_min[index])}°`;

        card.append(day, weatherIcon, max, min);
        forecastContainer.appendChild(card);
    });
}

// Load a default city when the app starts
cityInput.value = "Tenali";
form.requestSubmit();