# Ebalu Praise Weather Dashboard

A responsive weather dashboard built with plain HTML, CSS, and JavaScript ES modules.

## Features

- Search for a city and choose among matching locations.
- View current conditions and a seven-day forecast.
- Switch between Celsius and Fahrenheit; the unit preference is remembered.
- Add and remove favourite cities, then load them from the favourites list.
- Use the browser's location permission to see nearby weather.
- Restore the last viewed city on the next visit.
- Loading skeletons, clear error messages, and a responsive glass-style layout.

## API

Weather and city search data come from [Open-Meteo](https://open-meteo.com/):

- Geocoding: `https://geocoding-api.open-meteo.com/v1/search`
- Forecast: `https://api.open-meteo.com/v1/forecast`

No API key is required. The browser needs an internet connection to load current data. Location access requires the user's permission and a secure context (HTTPS or localhost).

## Screenshots

_Add dashboard screenshots here._

## What I learned

- Use `async`/`await` and `AbortController` to sequence API requests and cancel outdated searches.
- Convert API data for display without changing the source values.
- Persist user preferences and locations with `localStorage`.
- Build dynamic UI with `document.createElement` and `textContent` so API strings remain text instead of being interpreted as HTML.
