const todayFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
});

export function renderTodayDate(element) {
  element.textContent = todayFormatter.format(new Date());
}

function convertTemperature(celsius, unit) {
  return unit === "f" ? (celsius * 9) / 5 + 32 : celsius;
}

function formatTemperature(celsius, unit) {
  return `${Math.round(convertTemperature(celsius, unit))}°`;
}

export function updateUnitToggle(unit) {
  document.querySelectorAll(".unit-button").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.unit === unit));
  });
}

export function updateFavouriteToggle(isFavourite) {
  const button = document.querySelector("#favourite-toggle");
  button.textContent = isFavourite ? "★" : "☆";
  button.setAttribute("aria-pressed", String(isFavourite));
  button.setAttribute(
    "aria-label",
    isFavourite ? "Remove city from favourites" : "Add city to favourites",
  );
}

export function setWeatherLoading(isLoading) {
  const currentCard = document.querySelector("#current-weather");
  const forecastGrid = document.querySelector("#forecast-grid");
  currentCard.classList.toggle("is-loading", isLoading);

  if (isLoading) {
    forecastGrid.replaceChildren(
      ...Array.from({ length: 7 }, () => {
        const card = document.createElement("article");
        card.className = "forecast-card forecast-card--skeleton";
        card.setAttribute("aria-hidden", "true");
        for (const modifier of ["", " forecast-skeleton-line--icon", " forecast-skeleton-line--temp"]) {
          const line = document.createElement("span");
          line.className = `forecast-skeleton-line${modifier}`;
          card.append(line);
        }
        return card;
      }),
    );
    return;
  }

  forecastGrid.replaceChildren();
}

export function renderCityChoices(cities) {
  const picker = document.querySelector("#city-picker");
  const options = document.querySelector("#city-options");

  options.replaceChildren(
    ...cities.map((city, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = [city.name, city.admin1, city.country].filter(Boolean).join(", ");
      return option;
    }),
  );
  picker.hidden = false;
}

export function hideCityChoices() {
  document.querySelector("#city-picker").hidden = true;
  document.querySelector("#city-options").replaceChildren();
}

export function renderCurrentWeather(weather, unit) {
  document.querySelector("#current-city").textContent = weather.city;
  document.querySelector("#current-location").textContent =
    [weather.admin1, weather.country, weather.timezoneAbbreviation].filter(Boolean).join(" · ");
  const temperature = document.querySelector("#current-temperature");
  const degree = document.createElement("span");
  degree.textContent = "°";
  temperature.replaceChildren(
    document.createTextNode(String(Math.round(convertTemperature(weather.temperature, unit)))),
    degree,
  );
  document.querySelector("#current-condition").textContent = weather.condition;
  document.querySelector("#current-icon").textContent = weather.icon;
  document.querySelector("#current-wind").textContent = `${Math.round(weather.wind)} km/h`;
  document.querySelector("#current-humidity").textContent = `${weather.humidity}%`;
  document.querySelector("#forecast-unit").textContent = `Forecast temperatures in °${unit.toUpperCase()}`;
  updateFavouriteToggle(weather.isFavourite);
  updateLocalTime(weather.timezone);
}

export function renderForecast(forecast, unit) {
  const forecastGrid = document.querySelector("#forecast-grid");
  const weekdayFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    timeZone: "UTC",
  });

  forecastGrid.replaceChildren(
    ...forecast.map(({ date, icon, high, low }, index) => {
      const card = document.createElement("article");
      const forecastDate = new Date(`${date}T00:00:00Z`);
      const dayName = index === 0 ? "Today" : weekdayFormatter.format(forecastDate);
      card.className = "forecast-card";
      card.setAttribute(
        "aria-label",
        `${dayName}: ${formatTemperature(high, unit)} high, ${formatTemperature(low, unit)} low`,
      );

      const day = document.createElement("span");
      day.className = "forecast-day";
      day.textContent = dayName;

      const weatherIcon = document.createElement("span");
      weatherIcon.className = "forecast-icon";
      weatherIcon.setAttribute("aria-hidden", "true");
      weatherIcon.textContent = icon;

      const temperatures = document.createElement("span");
      temperatures.className = "forecast-temperatures";
      const highTemperature = document.createElement("span");
      highTemperature.className = "forecast-high";
      highTemperature.textContent = formatTemperature(high, unit);
      const lowTemperature = document.createElement("span");
      lowTemperature.className = "forecast-low";
      lowTemperature.textContent = formatTemperature(low, unit);
      temperatures.append(highTemperature, lowTemperature);

      card.append(day, weatherIcon, temperatures);
      return card;
    }),
  );
}

export function renderFavourites(favourites, selectedCity, onSelect, unit) {
  const list = document.querySelector("#favourites-list");
  document.querySelector("#favourite-count").textContent = String(favourites.length);

  list.replaceChildren(
    ...favourites.map((weather) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      const id = weather.id ?? `${weather.latitude},${weather.longitude}`;
      button.className = "favourite-button";
      button.type = "button";
      button.setAttribute("aria-current", String(id === selectedCity));
      button.setAttribute(
        "aria-label",
        `Show weather for ${weather.city ?? weather.name}, ${weather.country}`,
      );
      button.addEventListener("click", () => onSelect(id));

      const icon = document.createElement("span");
      icon.className = "favourite-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = weather.icon ?? "☆";

      const place = document.createElement("span");
      const name = document.createElement("span");
      name.className = "favourite-name";
      name.textContent = weather.city ?? weather.name;
      const country = document.createElement("span");
      country.className = "favourite-country";
      country.textContent = weather.country;
      place.append(name, country);

      const temperature = document.createElement("span");
      temperature.className = "favourite-temperature";
      temperature.textContent = Number.isFinite(weather.temperature)
        ? formatTemperature(weather.temperature, unit)
        : "—";

      button.append(icon, place, temperature);
      item.append(button);
      return item;
    }),
  );
}

export function setStatus(message) {
  const status = document.querySelector("#status-message");
  status.textContent = message;
  status.hidden = !message;
  const error = document.querySelector("#error-message");
  error.textContent = "";
  error.hidden = true;
}

export function setError(message) {
  const error = document.querySelector("#error-message");
  error.textContent = message;
  error.hidden = !message;
  const status = document.querySelector("#status-message");
  status.textContent = "";
  status.hidden = true;
}

export function updateLocalTime(timezone) {
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date());

  document.querySelector("#current-time").textContent = time;
}
