const input       = document.getElementById("cityInput");
const result      = document.getElementById("weatherResult");
const loading     = document.getElementById("loading");
const spinner     = document.getElementById("spinner");
const emptyState  = document.getElementById("emptyState");
const recentChips = document.getElementById("recentChips");
const particles    = document.getElementById("particles");
const unitToggle  = document.getElementById("unitToggle");
const brandIcon   = document.getElementById("brandIcon");

const RECENTS_KEY = "weatherNews.recentCities";
const MAX_RECENTS = 5;

let unit = "C";
let lastData = null;
let lastCityName = null;

// Enter to search
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") getWeather();
});

document.getElementById("searchBtn").addEventListener("click", () => getWeather());
document.getElementById("locationBtn").addEventListener("click", getLocation);
unitToggle.addEventListener("click", toggleUnit);

renderRecents();

async function getWeather(cityOverride) {
  const city = (cityOverride ?? input.value).trim();

  if (!city) {
    showError("Type a city name to search.");
    return;
  }

  input.value = city;
  hideEmptyState();
  setLoading(true, "Searching...");
  result.innerHTML = "";

  try {
    const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const cityName = formatCityName(city);
    lastData = data;
    lastCityName = cityName;
    renderWeather(data, cityName);
    addRecent(cityName);
  } catch {
    showError("City not found. Try a different spelling.");
  } finally {
    setLoading(false);
  }
}

function getLocation() {
  if (!navigator.geolocation) {
    showError("Geolocation is not supported by your browser.");
    return;
  }

  hideEmptyState();
  setLoading(true, "Getting your location...");
  result.innerHTML = "";

  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      try {
        const res = await fetch(`https://wttr.in/${coords.latitude},${coords.longitude}?format=j1`);
        if (!res.ok) throw new Error();
        const data = await res.json();

        const areaName = data.nearest_area?.[0]?.areaName?.[0]?.value || "Your location";
        lastData = data;
        lastCityName = areaName;
        renderWeather(data, areaName);
        addRecent(areaName);
      } catch {
        showError("Couldn't get the weather for your location.");
      } finally {
        setLoading(false);
      }
    },
    () => {
      setLoading(false);
      showError("Location permission denied.");
    }
  );
}

function toggleUnit() {
  unit = unit === "C" ? "F" : "C";
  unitToggle.textContent = `°${unit}`;
  if (lastData) renderWeather(lastData, lastCityName);
}

function convertTemp(celsius) {
  const c = Number(celsius);
  return unit === "F" ? Math.round((c * 9) / 5 + 32) : Math.round(c);
}

function renderWeather(data, cityName) {
  const current   = data.current_condition[0];
  const temp      = convertTemp(current.temp_C);
  const feelsLike = convertTemp(current.FeelsLikeC);
  const humidity  = current.humidity;
  const windKmph  = current.windspeedKmph;
  const uvIndex   = Number(current.uvIndex);
  const desc      = current.weatherDesc[0].value;
  const icon      = getWeatherIcon(desc);
  const iconAnim  = getIconAnimClass(desc);
  const astronomy = data.weather[0].astronomy?.[0];

  changeBackground(desc);
  renderParticles(desc);
  brandIcon.textContent = icon;

  const forecastHTML = data.weather.slice(0, 3).map((day) => {
    const dayDesc = day.hourly[4].weatherDesc[0].value;
    const maxT = convertTemp(day.maxtempC);
    const minT = convertTemp(day.mintempC);
    return `
      <div class="forecast-card">
        <span class="forecast-date">${formatDate(day.date)}</span>
        <span class="forecast-icon">${getWeatherIcon(dayDesc)}</span>
        <span class="forecast-temp">${maxT}° / ${minT}°</span>
        <span class="forecast-desc">${dayDesc}</span>
      </div>`;
  }).join("");

  result.innerHTML = `
    <div class="weather-inner">
      <div class="main-icon ${iconAnim}">${icon}</div>
      <div class="city-name">${cityName}</div>
      <div class="main-temp">${temp}°${unit}</div>
      <div class="main-desc">${desc}</div>
      ${uvIndex >= 0 ? renderUvBadge(uvIndex) : ""}
      <div class="weather-details">
        <div class="detail-pill">
          <strong>${feelsLike}°${unit}</strong>
          Feels like
        </div>
        <div class="detail-pill">
          <strong>${humidity}%</strong>
          Humidity
        </div>
        <div class="detail-pill">
          <strong>${windKmph} km/h</strong>
          Wind
        </div>
      </div>
      ${astronomy ? renderSunArc(astronomy) : ""}
    </div>
    <p class="forecast-title">Next 3 days</p>
    <div class="forecast">${forecastHTML}</div>
  `;
}

function getIconAnimClass(desc) {
  const w = desc.toLowerCase();
  if (w.includes("thunder") || w.includes("storm")) return "anim-storm";
  if (w.includes("snow") || w.includes("sleet"))     return "anim-snow";
  if (w.includes("rain") || w.includes("drizzle"))   return "anim-rain";
  if (w.includes("cloud") || w.includes("overcast") || w.includes("fog") || w.includes("mist")) return "anim-cloud";
  if (w.includes("sun") || w.includes("clear"))      return "anim-sun";
  return "";
}

function renderUvBadge(uvIndex) {
  let level = "low", label = "Low";
  if (uvIndex >= 11)      { level = "extreme";  label = "Extreme"; }
  else if (uvIndex >= 8)  { level = "veryhigh"; label = "Very high"; }
  else if (uvIndex >= 6)  { level = "high";     label = "High"; }
  else if (uvIndex >= 3)  { level = "moderate"; label = "Moderate"; }

  return `
    <div class="uv-badge uv-${level}">
      <span class="uv-dot"></span> UV ${uvIndex} · ${label}
    </div>`;
}

function parseTimeToMinutes(timeStr) {
  // e.g. "05:58 AM"
  const [time, meridiem] = timeStr.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (meridiem === "PM" && h !== 12) h += 12;
  if (meridiem === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function renderSunArc(astronomy) {
  if (!astronomy?.sunrise || !astronomy?.sunset) return "";

  const sunriseMin = parseTimeToMinutes(astronomy.sunrise);
  const sunsetMin  = parseTimeToMinutes(astronomy.sunset);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const dayLength = sunsetMin - sunriseMin;
  let progress = (nowMin - sunriseMin) / dayLength;
  progress = Math.max(0, Math.min(1, progress));

  const isDaytime = nowMin >= sunriseMin && nowMin <= sunsetMin;

  // Arc geometry: semicircle from (10,50) to (190,50), peak at (100,6)
  const angle = Math.PI * (1 - progress);
  const cx = 100, cy = 50, rx = 90, ry = 44;
  const dotX = cx - rx * Math.cos(angle);
  const dotY = cy - ry * Math.sin(angle);

  return `
    <div class="sun-arc-card">
      <svg class="sun-arc-svg" viewBox="0 0 200 54">
        <path class="sun-arc-path" d="M 10 50 A 90 44 0 0 1 190 50" />
        ${isDaytime ? `<circle class="sun-arc-dot" cx="${dotX.toFixed(1)}" cy="${dotY.toFixed(1)}" r="5" />` : ""}
      </svg>
      <div class="sun-arc-labels">
        <span>🌅 <strong>${astronomy.sunrise}</strong></span>
        <span>🌇 <strong>${astronomy.sunset}</strong></span>
      </div>
    </div>`;
}

function renderParticles(desc) {
  const w = desc.toLowerCase();
  particles.innerHTML = "";

  let type = null;
  if (w.includes("snow") || w.includes("sleet")) type = "snow";
  else if (w.includes("rain") || w.includes("drizzle") || w.includes("thunder")) type = "rain";

  if (!type) return;

  const count = type === "snow" ? 26 : 40;
  const frag = document.createDocumentFragment();

  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    const left = Math.random() * 100;
    const duration = type === "snow" ? 6 + Math.random() * 6 : 0.7 + Math.random() * 0.6;
    const delay = Math.random() * 6;

    if (type === "snow") {
      el.className = "flake";
      el.textContent = "❄";
      el.style.left = `${left}vw`;
      el.style.fontSize = `${8 + Math.random() * 10}px`;
      el.style.animationDuration = `${duration}s`;
      el.style.animationDelay = `${delay}s`;
    } else {
      el.className = "drop";
      el.style.left = `${left}vw`;
      el.style.height = `${40 + Math.random() * 40}px`;
      el.style.animationDuration = `${duration}s`;
      el.style.animationDelay = `${delay}s`;
    }

    frag.appendChild(el);
  }

  particles.appendChild(frag);
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

function setLoading(isLoading, msg) {
  loading.textContent = isLoading ? msg : "";
  spinner.hidden = !isLoading;
}

function showError(msg) {
  hideEmptyState();
  particles.innerHTML = "";
  result.innerHTML = `<p class="error-msg">${msg}</p>`;
}

function hideEmptyState() {
  emptyState.style.display = "none";
}

function formatCityName(city) {
  return city
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(dateStr) {
  const [, m, d] = dateStr.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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

function getRecents() {
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY)) || [];
  } catch {
    return [];
  }
}

function addRecent(cityName) {
  let recents = getRecents().filter((c) => c.toLowerCase() !== cityName.toLowerCase());
  recents.unshift(cityName);
  recents = recents.slice(0, MAX_RECENTS);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(recents));
  renderRecents();
}

function renderRecents() {
  const recents = getRecents();
  recentChips.innerHTML = recents
    .map((city) => `<button class="recent-chip" data-city="${city}">${city}</button>`)
    .join("");

  recentChips.querySelectorAll(".recent-chip").forEach((chip) => {
    chip.addEventListener("click", () => getWeather(chip.dataset.city));
  });
}
