// main.js - page interactions and weather fetching
console.log('main.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  const openButton = document.getElementById('open-cric');
  const weatherButton = document.getElementById('check-weather');
  const panel = document.getElementById('weather-panel');
  const searchInput = document.getElementById('food-search');
  const tableRows = Array.from(document.querySelectorAll('.food-table tbody tr'));
  const debugEl = document.getElementById('debug-log');

  function logDebug(...args) {
    const text = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
    console.log(...args);
    if (debugEl) {
      debugEl.textContent += text + '\n';
    }
  }

  if (!openButton) console.warn('openButton not found');
  if (!weatherButton) console.warn('weatherButton not found');
  if (!panel) console.warn('weather panel not found');
  if (!searchInput) console.warn('search input not found');

  if (openButton) {
    openButton.addEventListener('click', function () {
      window.open('https://cricbuzz.com', '_blank', 'noopener');
    });
  }

  if (weatherButton) {
    weatherButton.addEventListener('click', function () {
      if (panel) panel.classList.remove('hidden');
      weatherButton.disabled = true;
      weatherButton.textContent = 'Loading weather...';
      logDebug('Weather button clicked — fetching data');
      fetchWeatherData().then(() => {
        logDebug('fetchWeatherData completed');
      }).catch(err => {
        logDebug('fetchWeatherData error', err && err.message ? err.message : String(err));
      }).finally(() => {
        weatherButton.disabled = false;
        weatherButton.textContent = 'Check Pune & Bokaro Weather';
      });
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      const query = searchInput.value.trim().toLowerCase();
      tableRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }

  const cities = [
    {id: 'pune-card', name: 'Pune', lat: 18.5204, lon: 73.8567},
    {id: 'bokaro-card', name: 'Bokaro Steel City', lat: 23.6693, lon: 86.1511}
  ];

function weatherLabel(code) {
  if (code === 0) return 'Clear';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 51 && code <= 67) return 'Drizzle';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code >= 85 && code <= 86) return 'Snow showers';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Weather';
}

async function fetchWeather(city) {
  const card = document.getElementById(city.id);
  const status = card.querySelector('.weather-status');
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(city.lat));
    url.searchParams.set('longitude', String(city.lon));
    url.searchParams.set('current_weather', 'true');
    url.searchParams.set('timezone', 'Asia/Kolkata');

    logDebug('Fetching weather for ' + city.name + ' ' + url.toString());

    // Timeout using AbortController
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let response;
    try {
      response = await fetch(url.toString(), { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    if (!response) throw new Error('No response (request aborted)');
    logDebug('HTTP ' + response.status + ' ' + response.statusText);
    if (!response.ok) {
      const text = await response.text().catch(() => '<unreadable response>');
      logDebug('Non-OK response body (trim):', text.slice(0, 1000));
      throw new Error('Network response was not ok: ' + response.status);
    }

    const textBody = await response.text();
    logDebug('Response body (trim):', textBody.slice(0, 1000));
    let data;
    try { data = JSON.parse(textBody); } catch (e) { throw new Error('Invalid JSON in response'); }
    logDebug('Weather API parsed JSON for ' + city.name + ':', data && data.current_weather ? 'has current_weather' : 'no current_weather');

    const weather = data && data.current_weather;
    if (!weather) {
      status.textContent = 'No current weather available (see console)';
      status.classList.add('weather-error');
      return;
    }

    status.innerHTML = '' +
      '<div class="weather-value">' + weather.temperature.toFixed(1) + '°C</div>' +
      '<div class="weather-label">' + weatherLabel(Number(weather.weathercode)) + '</div>' +
      '<div class="weather-meta">Wind ' + Math.round(weather.windspeed) + ' km/h · ' + Math.round(weather.winddirection) + '°</div>';
  } catch (error) {
    console.error('fetchWeather error for', city.name, error);
    status.textContent = 'Unable to load weather (see console)';
    status.classList.add('weather-error');
  }
}

async function fetchWeatherData() {
  await Promise.all(cities.map(fetchWeather));
}

});
