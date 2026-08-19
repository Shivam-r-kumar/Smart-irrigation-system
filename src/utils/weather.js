const SHORT_RANGE_URL = "https://api.open-meteo.com/v1/forecast";
const SEASONAL_URL = "https://seasonal-api.open-meteo.com/v1/seasonal";

const dailyVariables = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "apparent_temperature_max",
  "precipitation_sum",
  "precipitation_probability_max",
  "wind_speed_10m_max",
  "relative_humidity_2m_mean",
  "sunrise",
  "sunset",
  "uv_index_max",
  "et0_fao_evapotranspiration",
];

const currentVariables = [
  "temperature_2m",
  "relative_humidity_2m",
  "apparent_temperature",
  "precipitation",
  "weather_code",
  "cloud_cover",
  "wind_speed_10m",
  "wind_direction_10m",
];

const monthlyVariables = [
  "temperature_2m_mean",
  "temperature_max24h_2m_mean",
  "temperature_min24h_2m_mean",
  "precipitation_mean",
  "cloud_cover_mean",
  "wind_speed_10m_mean",
];

export function getWeatherMeta(code = 3) {
  if (code === 0) return { key: "weather.conditions.clear", icon: "Sun", tone: "clear" };
  if ([1, 2].includes(code)) return { key: "weather.conditions.partlyCloudy", icon: "CloudSun", tone: "cloudy" };
  if (code === 3) return { key: "weather.conditions.overcast", icon: "Cloud", tone: "cloudy" };
  if ([45, 48].includes(code)) return { key: "weather.conditions.fog", icon: "CloudFog", tone: "fog" };
  if (code >= 51 && code <= 57) return { key: "weather.conditions.drizzle", icon: "CloudDrizzle", tone: "rain" };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { key: "weather.conditions.rain", icon: "CloudRain", tone: "rain" };
  if ((code >= 71 && code <= 77) || [85, 86].includes(code)) return { key: "weather.conditions.snow", icon: "CloudSnow", tone: "snow" };
  if (code >= 95) return { key: "weather.conditions.storm", icon: "CloudLightning", tone: "storm" };
  return { key: "weather.conditions.cloudy", icon: "CloudSun", tone: "cloudy" };
}

function valueAt(values, index, fallback = 0) {
  const value = values?.[index];
  return Number.isFinite(value) ? value : fallback;
}

function mapDailyWeather(daily = {}) {
  return (daily.time || []).map((date, index) => ({
    date,
    weatherCode: valueAt(daily.weather_code, index, 3),
    high: valueAt(daily.temperature_2m_max, index, 29),
    low: valueAt(daily.temperature_2m_min, index, 21),
    feelsLike: valueAt(daily.apparent_temperature_max, index, 30),
    rain: valueAt(daily.precipitation_sum, index),
    rainProbability: valueAt(daily.precipitation_probability_max, index),
    wind: valueAt(daily.wind_speed_10m_max, index, 8),
    humidity: valueAt(daily.relative_humidity_2m_mean, index, 60),
    sunrise: daily.sunrise?.[index]?.slice(11, 16) || "06:00",
    sunset: daily.sunset?.[index]?.slice(11, 16) || "18:30",
    uv: valueAt(daily.uv_index_max, index, 5),
    evapotranspiration: valueAt(daily.et0_fao_evapotranspiration, index, 3),
  }));
}

function mapMonthlyWeather(monthly = {}) {
  return (monthly.time || []).slice(0, 6).map((date, index) => ({
    date,
    average: valueAt(monthly.temperature_2m_mean, index, 24),
    high: valueAt(monthly.temperature_max24h_2m_mean, index, 30),
    low: valueAt(monthly.temperature_min24h_2m_mean, index, 18),
    rain: valueAt(monthly.precipitation_mean, index, 35),
    cloudCover: valueAt(monthly.cloud_cover_mean, index, 35),
    wind: valueAt(monthly.wind_speed_10m_mean, index, 8),
  }));
}

function mapCurrentWeather(current = {}, today) {
  return {
    temperature: Number.isFinite(current.temperature_2m) ? current.temperature_2m : Math.round((today.high + today.low) / 2),
    humidity: Number.isFinite(current.relative_humidity_2m) ? current.relative_humidity_2m : today.humidity,
    feelsLike: Number.isFinite(current.apparent_temperature) ? current.apparent_temperature : today.feelsLike,
    precipitation: Number.isFinite(current.precipitation) ? current.precipitation : today.rain,
    weatherCode: Number.isFinite(current.weather_code) ? current.weather_code : today.weatherCode,
    cloudCover: Number.isFinite(current.cloud_cover) ? current.cloud_cover : 55,
    wind: Number.isFinite(current.wind_speed_10m) ? current.wind_speed_10m : today.wind,
    windDirection: Number.isFinite(current.wind_direction_10m) ? current.wind_direction_10m : 220,
    time: current.time || new Date().toISOString(),
  };
}

function localIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function offsetDate(baseDate, amount) {
  const date = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  date.setDate(date.getDate() + amount);
  return date;
}

export function buildFallbackWeather(referenceDate = new Date()) {
  const days = Array.from({ length: 31 }, (_, index) => {
    const offset = index - 15;
    const date = offsetDate(referenceDate, offset);
    const rainPulse = Math.max(0, Math.sin((index + 2) * 0.78));
    const heatPulse = Math.sin(index * 0.52);
    const rainProbability = Math.round(18 + rainPulse * 68);
    return {
      date: localIsoDate(date),
      weatherCode: rainProbability > 72 ? 61 : rainProbability > 48 ? 2 : 1,
      high: Number((31 + heatPulse * 2.6 - rainPulse * 1.8).toFixed(1)),
      low: Number((23 + Math.sin(index * 0.42 - 1) * 1.8).toFixed(1)),
      feelsLike: Number((33 + heatPulse * 2.4).toFixed(1)),
      rain: Number((rainPulse * 13).toFixed(1)),
      rainProbability,
      wind: Number((7 + Math.abs(Math.cos(index * 0.6)) * 9).toFixed(1)),
      humidity: Math.round(54 + rainPulse * 31),
      sunrise: "05:56",
      sunset: "18:58",
      uv: Number((5 + Math.max(0, heatPulse) * 3).toFixed(1)),
      evapotranspiration: Number((3.2 + Math.max(0, heatPulse) * 1.7).toFixed(1)),
    };
  });
  const today = days[15];
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + index, 1);
    const seasonal = Math.cos((date.getMonth() - 5) / 12 * Math.PI * 2);
    const monsoon = [6, 7, 8].includes(date.getMonth());
    return {
      date: localIsoDate(date),
      average: Number((21 + seasonal * 8).toFixed(1)),
      high: Number((28 + seasonal * 7).toFixed(1)),
      low: Number((15 + seasonal * 8).toFixed(1)),
      rain: monsoon ? 135 - index * 12 : 24 + index * 4,
      cloudCover: monsoon ? 58 : 27 + index * 2,
      wind: Number((7 + Math.abs(seasonal) * 2).toFixed(1)),
    };
  });
  return {
    current: { temperature: 29, humidity: today.humidity, feelsLike: today.feelsLike, precipitation: 0, weatherCode: 2, cloudCover: 62, wind: today.wind, windDirection: 220, time: new Date().toISOString() },
    days,
    months,
    source: "fallback",
    seasonalSource: "fallback",
  };
}

export async function fetchFarmWeather(latitude, longitude, signal) {
  const shortRangeParams = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    timezone: "auto",
    past_days: "15",
    forecast_days: "16",
    current: currentVariables.join(","),
    daily: dailyVariables.join(","),
  });
  const seasonalParams = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    timezone: "auto",
    forecast_days: "183",
    monthly: monthlyVariables.join(","),
  });

  const [shortResponse, seasonalResponse] = await Promise.all([
    fetch(`${SHORT_RANGE_URL}?${shortRangeParams}`, { signal }),
    fetch(`${SEASONAL_URL}?${seasonalParams}`, { signal }).catch(() => null),
  ]);
  if (!shortResponse.ok) throw new Error(`Weather request failed with ${shortResponse.status}`);

  const shortRange = await shortResponse.json();
  const days = mapDailyWeather(shortRange.daily);
  if (days.length < 30) throw new Error("Weather response did not include the complete 30-day window");
  const todayIso = shortRange.current?.time?.slice(0, 10) || localIsoDate(new Date());
  const today = days.find((day) => day.date === todayIso) || days[15];

  let months = buildFallbackWeather().months;
  let seasonalSource = "fallback";
  if (seasonalResponse?.ok) {
    const seasonal = await seasonalResponse.json();
    const mappedMonths = mapMonthlyWeather(seasonal.monthly);
    if (mappedMonths.length === 6) {
      months = mappedMonths;
      seasonalSource = "live";
    }
  }

  return {
    current: mapCurrentWeather(shortRange.current, today),
    days,
    months,
    source: "live",
    seasonalSource,
  };
}
