const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: "short" });
const todayFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
});

export function renderTodayDate(element) {
  element.textContent = todayFormatter.format(new Date());
}

export function renderCurrentWeather(weather) {
  document.querySelector("#current-city").textContent = weather.city;
  document.querySelector("#current-location").textContent =
    `${weather.country} · ${weather.countryCode}`;
  document.querySelector("#current-temperature").innerHTML =
    `${weather.temperature}<span>°</span>`;
  document.querySelector("#current-condition").textContent = weather.condition;
  document.querySelector("#current-icon").textContent = weather.icon;
  document.querySelector("#current-wind").textContent = `${weather.wind} km/h`;
  updateLocalTime(weather.timezone);
}

export function renderForecast(forecast) {
  const forecastGrid = document.querySelector("#forecast-grid");

  forecastGrid.replaceChildren(
    ...forecast.map(({ date, icon, high, low }, index) => {
      const card = document.createElement("article");
      card.className = "forecast-card";
      card.setAttribute(
        "aria-label",
        `${index === 0 ? "Today" : weekdayFormatter.format(date)}: ${high} degrees high, ${low} degrees low`,
      );

      const day = document.createElement("span");
      day.className = "forecast-day";
      day.textContent = index === 0 ? "Today" : weekdayFormatter.format(date);

      const weatherIcon = document.createElement("span");
      weatherIcon.className = "forecast-icon";
      weatherIcon.setAttribute("aria-hidden", "true");
      weatherIcon.textContent = icon;

      const temperatures = document.createElement("span");
      temperatures.className = "forecast-temperatures";
      temperatures.innerHTML = `<span class="forecast-high">${high}°</span><span class="forecast-low">${low}°</span>`;

      card.append(day, weatherIcon, temperatures);
      return card;
    }),
  );
}

export function renderFavourites(favourites, selectedCity, onSelect) {
  const list = document.querySelector("#favourites-list");
  document.querySelector("#favourite-count").textContent = String(favourites.length);

  list.replaceChildren(
    ...favourites.map((weather) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.className = "favourite-button";
      button.type = "button";
      button.setAttribute("aria-current", String(weather.id === selectedCity));
      button.setAttribute(
        "aria-label",
        `Show weather for ${weather.city}, ${weather.country}, ${weather.temperature} degrees`,
      );
      button.addEventListener("click", () => onSelect(weather.id));

      const icon = document.createElement("span");
      icon.className = "favourite-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = weather.icon;

      const place = document.createElement("span");
      const name = document.createElement("span");
      name.className = "favourite-name";
      name.textContent = weather.city;
      const country = document.createElement("span");
      country.className = "favourite-country";
      country.textContent = weather.country;
      place.append(name, country);

      const temperature = document.createElement("span");
      temperature.className = "favourite-temperature";
      temperature.textContent = `${weather.temperature}°`;

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
  document.querySelector("#error-message").hidden = true;
}

export function setError(message) {
  const error = document.querySelector("#error-message");
  error.textContent = message;
  error.hidden = !message;
  document.querySelector("#status-message").hidden = true;
}

export function updateLocalTime(timezone) {
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date());

  document.querySelector("#current-time").textContent = time;
}
