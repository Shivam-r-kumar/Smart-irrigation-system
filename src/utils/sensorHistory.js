const profiles = {
  soilMoisture: { amplitude: 8, min: 0, max: 100, decimals: 0 },
  temperature: { amplitude: 5, min: -10, max: 60, decimals: 1 },
  humidity: { amplitude: 10, min: 0, max: 100, decimals: 0 },
  waterTankLevel: { amplitude: 7, min: 0, max: 100, decimals: 0 },
  soilPH: { amplitude: 0.22, min: 0, max: 14, decimals: 2 },
  ec: { amplitude: 0.14, min: 0, max: 10, decimals: 2 },
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function round(value, decimals) {
  const scale = 10 ** decimals;
  return Math.round(value * scale) / scale;
}

function seedFrom(value) {
  return [...value].reduce((total, character) => total + character.charCodeAt(0), 0);
}

function formatHour(timestamp, fallbackHour) {
  const date = new Date(timestamp);
  if (!Number.isNaN(date.getTime())) return `${String(date.getHours()).padStart(2, "0")}:00`;
  return `${String(fallbackHour).padStart(2, "0")}:00`;
}

export function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getRecentDays(count = 7) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (count - 1 - index));
    return { date, key: formatDateKey(date) };
  });
}

export function normalizeSensorHistory(records, metricId) {
  return records
    .filter((record) => record?.[metricId] !== undefined && record?.[metricId] !== null)
    .map((record, index) => {
      const rawValue = record[metricId];
      return {
        hour: record.hour || formatHour(record.timestamp, index),
        timestamp: record.timestamp,
        value: typeof rawValue === "boolean" ? Number(rawValue) : Number(rawValue),
      };
    })
    .filter((record) => Number.isFinite(record.value));
}

export function limitHistoryToElapsedTime(series, isToday, now = new Date()) {
  if (!isToday) return series;
  const currentHour = now.getHours();
  return series.filter((point) => {
    const pointTime = new Date(point.timestamp);
    if (!Number.isNaN(pointTime.getTime())) return pointTime <= now;
    return Number.parseInt(point.hour, 10) <= currentHour;
  });
}

export function buildFallbackHistory(metricId, currentValue, dateKey) {
  const seed = seedFrom(`${metricId}-${dateKey}`);
  const numericCurrent = typeof currentValue === "boolean" ? Number(currentValue) : Number(currentValue);

  return Array.from({ length: 24 }, (_, hour) => {
    let value;
    if (metricId === "pumpState") {
      value = (hour >= 5 && hour <= 7) || (hour >= 18 && hour <= 20) ? 1 : 0;
    } else if (metricId === "lightIntensity") {
      const daylight = hour >= 6 && hour <= 18 ? Math.sin(((hour - 6) / 12) * Math.PI) : 0;
      const cloudFactor = 0.82 + ((seed + hour * 17) % 15) / 100;
      value = Math.round(Math.max(0, (numericCurrent || 18500) * daylight * cloudFactor));
    } else {
      const profile = profiles[metricId] || { amplitude: 5, min: 0, max: 100, decimals: 1 };
      const base = Number.isFinite(numericCurrent) ? numericCurrent : 0;
      const phase = (seed % 8) - 4;
      const wave = Math.sin(((hour + phase) / 24) * Math.PI * 2) * profile.amplitude;
      const noise = ((((seed * (hour + 3)) % 19) / 18) - 0.5) * profile.amplitude * 0.35;
      value = round(clamp(base + wave + noise, profile.min, profile.max), profile.decimals);
    }

    return {
      hour: `${String(hour).padStart(2, "0")}:00`,
      timestamp: `${dateKey}T${String(hour).padStart(2, "0")}:00:00`,
      value,
    };
  });
}
