const forecastTemplates = [
  { dayOffset: 0, icon: "☀️", high: 22, low: 14 },
  { dayOffset: 1, icon: "🌤️", high: 23, low: 15 },
  { dayOffset: 2, icon: "☁️", high: 19, low: 13 },
  { dayOffset: 3, icon: "🌦️", high: 18, low: 12 },
  { dayOffset: 4, icon: "☀️", high: 24, low: 16 },
  { dayOffset: 5, icon: "🌤️", high: 22, low: 15 },
  { dayOffset: 6, icon: "☀️", high: 25, low: 17 },
];

const cityData = [
  {
    id: "london",
    city: "London",
    country: "United Kingdom",
    countryCode: "GB",
    timezone: "Europe/London",
    temperature: 18,
    condition: "Partly cloudy",
    icon: "⛅",
    wind: 12,
    favourite: true,
    forecastOffset: 0,
  },
  {
    id: "tokyo",
    city: "Tokyo",
    country: "Japan",
    countryCode: "JP",
    timezone: "Asia/Tokyo",
    temperature: 26,
    condition: "Sunny intervals",
    icon: "🌤️",
    wind: 8,
    favourite: true,
    forecastOffset: 4,
  },
  {
    id: "paris",
    city: "Paris",
    country: "France",
    countryCode: "FR",
    timezone: "Europe/Paris",
    temperature: 21,
    condition: "Mostly sunny",
    icon: "🌤️",
    wind: 10,
    favourite: true,
    forecastOffset: 2,
  },
  {
    id: "new-york",
    city: "New York",
    country: "United States",
    countryCode: "US",
    timezone: "America/New_York",
    temperature: 24,
    condition: "Clear skies",
    icon: "☀️",
    wind: 14,
    favourite: false,
    forecastOffset: 1,
  },
  {
    id: "lagos",
    city: "Lagos",
    country: "Nigeria",
    countryCode: "NG",
    timezone: "Africa/Lagos",
    temperature: 29,
    condition: "Warm and bright",
    icon: "☀️",
    wind: 9,
    favourite: false,
    forecastOffset: 5,
  },
];

function createForecast(offset) {
  const today = new Date();

  return forecastTemplates.map((entry) => {
    const date = new Date(today);
    date.setDate(today.getDate() + entry.dayOffset);
    return {
      date,
      icon: entry.icon,
      high: entry.high + offset,
      low: entry.low + offset,
    };
  });
}

function toWeatherRecord(city) {
  return {
    ...city,
    forecast: createForecast(city.forecastOffset),
  };
}

export async function getCityWeather(cityName) {
  const query = cityName.trim().toLocaleLowerCase();
  const city = cityData.find(
    ({ city: name, country, countryCode }) =>
      name.toLocaleLowerCase() === query ||
      country.toLocaleLowerCase() === query ||
      countryCode.toLocaleLowerCase() === query,
  );

  if (!city) {
    throw new Error(
      `No demo weather found for "${cityName.trim()}". Try London, Tokyo, Paris, New York, or Lagos.`,
    );
  }

  return toWeatherRecord(city);
}

export async function getFavouriteCities() {
  return cityData.filter(({ favourite }) => favourite).map(toWeatherRecord);
}
