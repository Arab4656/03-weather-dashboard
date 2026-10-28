import { getCityWeather, getFavouriteCities } from "./api.js";
import {
  renderCurrentWeather,
  renderFavourites,
  renderForecast,
  renderTodayDate,
  setError,
  setStatus,
  updateLocalTime,
} from "./ui.js";

const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#city-search");
const favourites = await getFavouriteCities();
let activeWeather;

async function showCity(cityName, { announce = false } = {}) {
  setError("");
  try {
    const weather = await getCityWeather(cityName);
    activeWeather = weather;
    renderCurrentWeather(weather);
    renderForecast(weather.forecast);
    renderFavourites(favourites, weather.id, selectFavourite);
    if (announce) {
      setStatus(`Showing demo weather for ${weather.city}, ${weather.country}.`);
    }
    return true;
  } catch (error) {
    setError(error instanceof Error ? error.message : "Unable to load weather for that city.");
    return false;
  }
}

async function selectFavourite(cityId) {
  const favourite = favourites.find(({ id }) => id === cityId);
  if (!favourite) {
    setError("That favourite is not available.");
    return;
  }

  await showCity(favourite.city, { announce: true });
}

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const cityName = searchInput.value.trim();
  if (!cityName) {
    setError("Enter a city name to search.");
    searchInput.focus();
    return;
  }

  const loaded = await showCity(cityName, { announce: true });
  if (loaded) {
    searchInput.value = "";
    searchInput.blur();
  }
});

renderTodayDate(document.querySelector("#today-date"));
await showCity("London");
window.setInterval(() => {
  if (activeWeather) {
    updateLocalTime(activeWeather.timezone);
  }
}, 60_000);
