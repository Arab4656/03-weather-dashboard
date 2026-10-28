const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

async function fetchJson(url, signal) {
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(
        `Open-Meteo request failed (${response.status} ${response.statusText}).`,
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    if (error instanceof Error && error.message.startsWith("Open-Meteo request failed")) {
      throw error;
    }

    const reason = error instanceof Error ? error.message : "Unknown network error";
    throw new Error(`Unable to load weather data from Open-Meteo: ${reason}`);
  }
}

export async function searchCity(name, { signal } = {}) {
  const query = encodeURIComponent(name.trim());
  try {
    const data = await fetchJson(`${GEOCODING_URL}?name=${query}&count=5`, signal);
    return data.results ?? [];
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    const reason = error instanceof Error ? error.message : "Unknown search error";
    throw new Error(`City search failed: ${reason}`);
  }
}

export async function getForecast(lat, lon, { signal } = {}) {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
  );
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min",
  );
  url.searchParams.set("timezone", "auto");

  return fetchJson(url, signal);
}
