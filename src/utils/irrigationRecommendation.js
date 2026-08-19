export function getIrrigationRecommendation({ soilMoisture, temperature, humidity, rainProbability, waterTankLevel }) {
  if (waterTankLevel < 15) {
    return { irrigationRequired: false, unsafe: true, reason: "Tank level is too low for safe pump operation.", recommendedDuration: 0, estimatedWater: 0 };
  }
  if (rainProbability > 75) {
    return { irrigationRequired: false, unsafe: false, reason: "Heavy rain is likely, so irrigation can be delayed.", recommendedDuration: 0, estimatedWater: 0 };
  }
  if (soilMoisture > 68) {
    return { irrigationRequired: false, unsafe: false, reason: "Soil is already above the target moisture range.", recommendedDuration: 0, estimatedWater: 0 };
  }
  const duration = Math.round(Math.max(4, Math.min(12, (55 - soilMoisture) / 2 + (temperature > 32 ? 2 : 0) - (humidity > 75 ? 1 : 0))));
  return { irrigationRequired: soilMoisture < 48, unsafe: false, reason: "Soil moisture is below target and no heavy rainfall is expected.", recommendedDuration: duration, estimatedWater: Math.round(duration * 1.5) };
}
