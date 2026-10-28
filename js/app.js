import { getForecast, searchCity } from "./api.js";
import weatherCodes from "./weatherCodes.js";
import {
  hideCityChoices,
  renderCityChoices,
  renderCurrentWeather,
  renderFavourites,
  renderForecast,
  renderTodayDate,
  setError,
  setStatus,
  setWeatherLoading,
  updateFavouriteToggle,
  updateLocalTime,
  updateUnitToggle,
} from "./ui.js";

const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#city-search");
const cityOptions = document.querySelector("#city-options");
const citySelectButton = document.querySelector("#city-select-button");
const locationButton = document.querySelector("#location-button");
const favourites = [];
const favouriteWeather = new Map();
let activeWeather;
let activeController;
let weatherRequest = 0;
let pendingLocations = [];
let unit = "c";
let unitPreferenceWarning;
let storageWarning;

function locationId(location) {
  return `${location.latitude},${location.longitude}`;
}

function readStoredFavourites() {
  try {
    const saved = JSON.parse(localStorage.getItem("weather-favourites") ?? "[]");
    if (!Array.isArray(saved)) {
      throw new Error("Saved favourites are not a list.");
    }

    return saved.filter(
      (location) =>
        location &&
        typeof location.name === "string" &&
        typeof location.country === "string" &&
        Number.isFinite(location.latitude) &&
        Number.isFinite(location.longitude),
    );
  } catch (error) {
    storageWarning =
      `Saved favourites could not be read: ${error instanceof Error ? error.message : "storage unavailable"}`;
    return [];
  }
}

try {
  const savedUnit = localStorage.getItem("weather-unit");
  if (savedUnit === "c" || savedUnit === "f") {
    unit = savedUnit;
  }
} catch (error) {
  unitPreferenceWarning =
    `Temperature preference could not be read: ${error instanceof Error ? error.message : "storage unavailable"}`;
}

favourites.push(...readStoredFavourites());

function beginRequest() {
  activeController?.abort();
  activeController = new AbortController();
  weatherRequest += 1;
  return { requestId: weatherRequest, signal: activeController.signal };
}

function isAbortError(error) {
  return error instanceof DOMException && error.name === "AbortError";
}

function createWeather(location, forecast) {
  const currentConditions = weatherCodes[forecast.current.weather_code] ?? {
    label: "Conditions unavailable",
    emoji: "🌡️",
  };

  return {
    id: location.id ?? locationId(location),
    name: location.name,
    city: location.name,
    country: location.country,
    admin1: location.admin1,
    latitude: location.latitude,
    longitude: location.longitude,
    timezone: forecast.timezone || location.timezone,
    timezoneAbbreviation: forecast.timezone_abbreviation,
    temperature: forecast.current.temperature_2m,
    condition: currentConditions.label,
    icon: currentConditions.emoji,
    wind: forecast.current.wind_speed_10m,
    humidity: forecast.current.relative_humidity_2m,
    forecast: forecast.daily.time.map((date, index) => {
      const conditions = weatherCodes[forecast.daily.weather_code[index]] ?? {
        label: "Conditions unavailable",
        emoji: "🌡️",
      };

      return {
        date,
        icon: conditions.emoji,
        high: forecast.daily.temperature_2m_max[index],
        low: forecast.daily.temperature_2m_min[index],
      };
    }),
  };
}

function saveLastViewed(weather) {
  try {
    localStorage.setItem(
      "weather-last-viewed",
      JSON.stringify({
        name: weather.name,
        country: weather.country,
        latitude: weather.latitude,
        longitude: weather.longitude,
        admin1: weather.admin1,
        timezone: weather.timezone,
      }),
    );
  } catch (error) {
    storageWarning =
      `The last viewed city could not be saved: ${error instanceof Error ? error.message : "storage unavailable"}`;
  }
}

function saveFavourites() {
  try {
    const stored = favourites.map(({ name, country, latitude, longitude }) => ({
      name,
      country,
      latitude,
      longitude,
    }));
    localStorage.setItem("weather-favourites", JSON.stringify(stored));
    storageWarning = undefined;
    return true;
  } catch (error) {
    setError(
      `Favourite could not be saved: ${error instanceof Error ? error.message : "storage unavailable"}`,
    );
    return false;
  }
}

function renderFavouriteList() {
  const displayItems = favourites.map((location) => {
    const weather = favouriteWeather.get(locationId(location));
    return weather ? { ...location, ...weather } : location;
  });
  renderFavourites(displayItems, activeWeather?.id, selectFavourite, unit);
}

function isFavourite(weather) {
  return favourites.some((location) => locationId(location) === locationId(weather));
}

function renderWeather(weather, announce) {
  activeWeather = { ...weather, isFavourite: isFavourite(weather) };
  if (activeWeather.isFavourite) {
    favouriteWeather.set(activeWeather.id, activeWeather);
  }
  setWeatherLoading(false);
  renderCurrentWeather(activeWeather, unit);
  renderForecast(activeWeather.forecast, unit);
  renderFavouriteList();
  saveLastViewed(activeWeather);
  if (announce) {
    setStatus(`Showing current weather for ${activeWeather.city}, ${activeWeather.country}.`);
  } else {
    setStatus("");
  }
}

function restoreActiveWeather() {
  if (activeWeather) {
    renderWeather(activeWeather, false);
  } else {
    setWeatherLoading(false);
  }
}

async function loadWeather(location, requestId, signal, announce = false) {
  try {
    const forecast = await getForecast(location.latitude, location.longitude, { signal });
    if (requestId !== weatherRequest || signal.aborted) {
      return false;
    }

    hideCityChoices();
    renderWeather(createWeather(location, forecast), announce);
    return true;
  } catch (error) {
    if (requestId === weatherRequest && !isAbortError(error)) {
      restoreActiveWeather();
      setError(error instanceof Error ? error.message : "Unable to load weather for that city.");
    }
    return false;
  }
}

async function selectFavourite(cityId) {
  const favourite = favourites.find((location) => locationId(location) === cityId);
  if (!favourite) {
    setError("That favourite is not available.");
    return;
  }

  const { requestId, signal } = beginRequest();
  pendingLocations = [];
  hideCityChoices();
  setWeatherLoading(true);
  setStatus("Loading weather…");
  try {
    await loadWeather({ ...favourite, id: cityId }, requestId, signal, true);
  } catch (error) {
    if (requestId === weatherRequest && !isAbortError(error)) {
      restoreActiveWeather();
      setError(error instanceof Error ? error.message : "Unable to load that favourite.");
    }
  }
}

async function chooseCity() {
  const location = pendingLocations[Number(cityOptions.value)];
  if (!location) {
    setError("Choose a city from the matching locations.");
    return;
  }

  const requestId = weatherRequest;
  const signal = activeController?.signal;
  if (!signal || signal.aborted) {
    setError("That search has expired. Search for the city again.");
    hideCityChoices();
    return;
  }

  setWeatherLoading(true);
  setStatus("Loading weather…");
  try {
    const loaded = await loadWeather(location, requestId, signal, true);
    if (loaded && requestId === weatherRequest) {
      searchInput.value = "";
      searchInput.blur();
    }
  } catch (error) {
    if (requestId === weatherRequest && !isAbortError(error)) {
      restoreActiveWeather();
      setError(error instanceof Error ? error.message : "Unable to load that city.");
    }
  }
}

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const cityName = searchInput.value.trim();
  if (!cityName) {
    setError("Enter a city name to search.");
    searchInput.focus();
    return;
  }

  const { requestId, signal } = beginRequest();
  pendingLocations = [];
  hideCityChoices();
  setError("");
  setWeatherLoading(true);
  setStatus("Searching for city…");
  try {
    const cities = await searchCity(cityName, { signal });
    if (requestId !== weatherRequest || signal.aborted) {
      return;
    }
    if (cities.length === 0) {
      restoreActiveWeather();
      setError(`We couldn't find "${cityName}". Try another city name.`);
      return;
    }
    if (cities.length > 1) {
      pendingLocations = cities;
      restoreActiveWeather();
      renderCityChoices(cities);
      setStatus("Choose the matching city to see its weather.");
      return;
    }

    setStatus("Loading weather…");
    const loaded = await loadWeather(cities[0], requestId, signal, true);
    if (loaded && requestId === weatherRequest) {
      searchInput.value = "";
      searchInput.blur();
    }
  } catch (error) {
    if (requestId === weatherRequest && !isAbortError(error)) {
      restoreActiveWeather();
      setError(error instanceof Error ? error.message : "Unable to search for that city.");
    }
  }
});

document.querySelector("#favourite-toggle").addEventListener("click", () => {
  if (!activeWeather) {
    setError("Load a city before adding it to favourites.");
    return;
  }

  const index = favourites.findIndex(
    (location) => locationId(location) === locationId(activeWeather),
  );
  if (index >= 0) {
    favourites.splice(index, 1);
    favouriteWeather.delete(locationId(activeWeather));
    activeWeather = { ...activeWeather, isFavourite: false };
    if (saveFavourites()) {
      setStatus(`${activeWeather.city} removed from favourites.`);
    }
  } else {
    const location = {
      name: activeWeather.name,
      country: activeWeather.country,
      latitude: activeWeather.latitude,
      longitude: activeWeather.longitude,
    };
    favourites.push(location);
    activeWeather = { ...activeWeather, isFavourite: true };
    favouriteWeather.set(locationId(activeWeather), activeWeather);
    if (saveFavourites()) {
      setStatus(`${activeWeather.city} added to favourites.`);
    }
  }

  updateFavouriteToggle(activeWeather.isFavourite);
  renderFavouriteList();
});

citySelectButton.addEventListener("click", chooseCity);

document.querySelectorAll(".unit-button").forEach((button) => {
  button.addEventListener("click", () => {
    unit = button.dataset.unit;
    updateUnitToggle(unit);
    if (activeWeather) {
      renderWeather(activeWeather, false);
    }
    try {
      localStorage.setItem("weather-unit", unit);
      setStatus(`Temperature units set to °${unit.toUpperCase()}.`);
    } catch (error) {
      setError(
        `Temperature changed, but the preference could not be saved: ${error instanceof Error ? error.message : "storage unavailable"}`,
      );
    }
  });
});

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 12_000,
      maximumAge: 60_000,
    });
  });
}

function getLocationError(error) {
  if (error?.code === 1) {
    return "Location permission was denied. Allow location access in your browser settings, or search for a city instead.";
  }
  if (error?.code === 2) {
    return "Your location is unavailable right now. Check your device location settings or search for a city.";
  }
  if (error?.code === 3) {
    return "Finding your location timed out. Please try again or search for a city.";
  }
  return error instanceof Error ? error.message : "Unable to get your location.";
}

async function useCurrentLocation() {
  if (!navigator.geolocation) {
    setError("This browser does not support location. Search for a city instead.");
    return;
  }

  const { requestId, signal } = beginRequest();
  pendingLocations = [];
  hideCityChoices();
  setError("");
  setWeatherLoading(true);
  setStatus("Finding your location…");
  try {
    const position = await getCurrentPosition();
    if (requestId !== weatherRequest || signal.aborted) {
      return;
    }

    const location = {
      name: "My location",
      country: "Current location",
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    setStatus("Loading local weather…");
    await loadWeather(location, requestId, signal, true);
  } catch (error) {
    if (requestId === weatherRequest && !isAbortError(error)) {
      restoreActiveWeather();
      setError(getLocationError(error));
    }
  }
}

locationButton.addEventListener("click", useCurrentLocation);

function readLastViewed() {
  try {
    const saved = JSON.parse(localStorage.getItem("weather-last-viewed") ?? "null");
    if (
      saved &&
      typeof saved.name === "string" &&
      typeof saved.country === "string" &&
      Number.isFinite(saved.latitude) &&
      Number.isFinite(saved.longitude)
    ) {
      return saved;
    }
  } catch (error) {
    storageWarning =
      `The last viewed city could not be read: ${error instanceof Error ? error.message : "storage unavailable"}`;
  }
  return null;
}

async function getPreviouslyAllowedPosition() {
  if (!navigator.geolocation || !navigator.permissions?.query) {
    return null;
  }

  try {
    const permission = await navigator.permissions.query({ name: "geolocation" });
    if (permission.state !== "granted") {
      return null;
    }
    return await getCurrentPosition();
  } catch {
    return null;
  }
}

async function initialize() {
  renderTodayDate(document.querySelector("#today-date"));
  updateUnitToggle(unit);
  renderFavouriteList();
  setWeatherLoading(true);
  const { requestId, signal } = beginRequest();
  setStatus("Loading weather…");

  let location = readLastViewed();
  if (!location) {
    try {
      const position = await getPreviouslyAllowedPosition();
      if (position) {
        location = {
          name: "My location",
          country: "Current location",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      }
    } catch {
      location = null;
    }
  }

  try {
    if (!location) {
      const cities = await searchCity("London", { signal });
      if (cities.length === 0) {
        throw new Error("We couldn't find the default city. Search for a city to get started.");
      }
      location =
        cities.find(
          ({ name, country }) =>
            name.toLocaleLowerCase() === "london" &&
            country.toLocaleLowerCase() === "united kingdom",
        ) ?? cities[0];
    }

    if (requestId === weatherRequest && !signal.aborted) {
      await loadWeather(location, requestId, signal);
    }
  } catch (error) {
    if (requestId === weatherRequest && !isAbortError(error)) {
      restoreActiveWeather();
      setError(error instanceof Error ? error.message : "Unable to load the weather dashboard.");
    }
  }

  if (storageWarning && document.querySelector("#error-message").hidden) {
    setError(storageWarning);
  } else if (unitPreferenceWarning && document.querySelector("#error-message").hidden) {
    setError(unitPreferenceWarning);
  }
}

try {
  await initialize();
} catch (error) {
  restoreActiveWeather();
  setError(error instanceof Error ? error.message : "Unable to start the weather dashboard.");
}

window.setInterval(() => {
  if (activeWeather) {
    updateLocalTime(activeWeather.timezone);
  }
}, 60_000);
