const input   = document.getElementById("cityInput");
const result  = document.getElementById("weatherResult");
const loading = document.getElementById("loading");

// Enter para buscar
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") getWeather();
});

async function getWeather() {
  const city = input.value.trim();

  if (!city) {
    showError("Type a city name! 🌍");
    return;
  }

  setLoading("Searching...");
  result.innerHTML = "";

  try {
    const res  = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    renderWeather(data, formatCityName(city));
  } catch {
    showError("City not found. try again!");
  } finally {
    setLoading("");
  }
}

function getLocation() {
  if (!navigator.geolocation) {
    showError("Geolocalization not found.");
    return;
  }

  setLoading("Getting location...");
  result.innerHTML = "";

  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      try {
        const res  = await fetch(`https://wttr.in/${coords.latitude},${coords.longitude}?format=j1`);
        if (!res.ok) throw new Error();
        const data = await res.json();

        const areaName = data.nearest_area?.[0]?.areaName?.[0]?.value || "Sua localização";
        renderWeather(data, areaName);
      } catch {
        showError("Error retrieving weather for your location.");
      } finally {
        setLoading("");
      }
    },
    () => {
      setLoading("");
      showError("Location permission denied. ❌");
    }
  );
}

function renderWeather(data, cityName) {
  const current  = data.current_condition[0];
  const temp     = current.temp_C;
  const feelsLike= current.FeelsLikeC;
  const humidity = current.humidity;
  const desc     = current.weatherDesc[0].value;
  const icon     = getWeatherIcon(desc);

  changeBackground(desc);

  // previsão 3 dias
  const forecastHTML = data.weather.slice(0, 3).map(day => {
    const dayDesc = day.hourly[4].weatherDesc[0].value;
    return `
      <div class="forecast-card">
        <span class="forecast-date">${formatDate(day.date)}</span>
        <span class="forecast-icon">${getWeatherIcon(dayDesc)}</span>
        <span class="forecast-temp">${day.maxtempC}° / ${day.mintempC}°</span>
        <span class="forecast-desc">${dayDesc}</span>
      </div>`;
  }).join("");

  result.innerHTML = `
    <div class="weather-inner">
      <div class="main-icon">${icon}</div>
      <div class="city-name">${cityName}</div>
      <div class="main-temp">${temp}°C</div>
      <div class="main-desc">${desc}</div>
      <div class="weather-details">
        <div class="detail-pill">
          <strong>${feelsLike}°C</strong>
          Feelslike
        </div>
        <div class="detail-pill">
          <strong>${humidity}%</strong>
          Humidity
        </div>
      </div>
    </div>
    <p class="forecast-title">Next 3 days</p>
    <div class="forecast">${forecastHTML}</div>
  `;
}

function changeBackground(desc) {
  const w = desc.toLowerCase();
  let gradient;

  if (w.includes("sun") || w.includes("clear")) {
    gradient = "linear-gradient(-45deg, #92400e, #d97706, #f59e0b, #fcd34d)";
  } else if (w.includes("rain") || w.includes("drizzle")) {
    gradient = "linear-gradient(-45deg, #0c4a6e, #0369a1, #0ea5e9, #38bdf8)";
  } else if (w.includes("thunder") || w.includes("storm")) {
    gradient = "linear-gradient(-45deg, #1e1b4b, #312e81, #4338ca, #6366f1)";
  } else if (w.includes("snow") || w.includes("sleet")) {
    gradient = "linear-gradient(-45deg, #1e3a5f, #2563eb, #93c5fd, #e0f2fe)";
  } else if (w.includes("fog") || w.includes("mist") || w.includes("overcast")) {
    gradient = "linear-gradient(-45deg, #374151, #4b5563, #6b7280, #9ca3af)";
  } else {
    gradient = "linear-gradient(-45deg, #0f172a, #1e3a5f, #0ea5e9, #38bdf8)";
  }

  document.body.style.background = gradient;
  document.body.style.backgroundSize = "400% 400%";
}

function setLoading(msg) {
  loading.textContent = msg;
}

function showError(msg) {
  result.innerHTML = `<p class="error-msg">${msg}</p>`;
}

function formatCityName(city) {
  return city
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(dateStr) {
  const [, m, d] = dateStr.split("-");
  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${d} ${months[parseInt(m) - 1]}`;
}

function getWeatherIcon(desc) {
  const w = desc.toLowerCase();
  if (w.includes("thunder") || w.includes("storm")) return "⛈️";
  if (w.includes("snow") || w.includes("blizzard"))  return "❄️";
  if (w.includes("sleet"))                            return "🌨️";
  if (w.includes("heavy rain"))                       return "🌧️";
  if (w.includes("drizzle") || w.includes("rain"))    return "🌦️";
  if (w.includes("fog") || w.includes("mist"))        return "🌫️";
  if (w.includes("overcast"))                         return "☁️";
  if (w.includes("cloud") || w.includes("partly"))    return "⛅";
  if (w.includes("sun") || w.includes("clear"))       return "☀️";
  return "🌡️";
}