# ☀️ Weather News

A clean, real-time weather app with a 3-day forecast, geolocation support, unit
switching (°C/°F) and recent searches — built with plain HTML, CSS and
JavaScript, no frameworks.

**[Live demo →](https://gabriel23ramos.github.io/Weather-News/)**

## Features

- 🔍 Search current weather by city name
- 📍 "Use my location" button via the Geolocation API
- 📅 3-day forecast with icons and min/max temperatures
- 🌡️ Feels like, humidity and wind speed at a glance
- ☀️ UV index with a color-coded risk badge (Low → Extreme)
- 🌅 Sunrise/sunset arc showing where the sun is right now
- 🌧️ ❄️ Animated rain/snow particles that react to the current conditions
- 🔄 One-click °C / °F unit toggle (re-renders instantly, no extra request)
- 🕘 Recent searches saved to `localStorage`, one click to search again
- 🎨 Background gradient reacts to current weather conditions
- 📱 Fully responsive, down to small phone screens

## Tech stack

- HTML5 / CSS3 (glassmorphism UI, no CSS framework)
- Vanilla JavaScript (ES6+, `async/await`, `fetch`)
- [wttr.in](https://github.com/chubin/wttr.in) as the weather data source — a
  free API that requires no API key

## Running locally

This is a static site, so there's no build step:

```bash
git clone https://github.com/Gabriel23Ramos/Weather-News.git
cd Weather-News
```

Then just open `index.html` in your browser, or serve the folder with any
static server, e.g.:

```bash
npx serve .
```

## What I practiced building this

- Consuming a third-party REST API with `fetch` and `async/await`
- Handling loading and error states in the UI
- Persisting small bits of state with `localStorage`
- Writing responsive, mobile-first CSS without a framework
- Structuring vanilla JS so the UI stays predictable as features are added

## Author

**Gabriel Ramos** — [GitHub](https://github.com/Gabriel23Ramos) · [LinkedIn](https://www.linkedin.com/in/gabrielramosdev)
