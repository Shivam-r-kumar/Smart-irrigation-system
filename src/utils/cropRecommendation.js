const cropProfiles = {
  Rabi: ["Wheat", "Chickpea", "Mustard", "Barley"],
  Kharif: ["Rice", "Maize", "Chickpea", "Mustard"],
  Zaid: ["Maize", "Chickpea", "Wheat", "Barley"],
};

const idealPh = { Wheat: 6.7, Chickpea: 7, Mustard: 6.8, Barley: 7.2, Rice: 6.2, Maize: 6.5 };
const idealMoisture = { Wheat: 48, Chickpea: 40, Mustard: 42, Barley: 43, Rice: 74, Maize: 54 };

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function recommendCrops(values) {
  const seasonCrops = cropProfiles[values.season] || cropProfiles.Rabi;
  return seasonCrops.map((name, index) => {
    const phScore = 100 - Math.abs(Number(values.soilPH) - idealPh[name]) * 14;
    const moistureScore = 100 - Math.abs(Number(values.soilMoisture) - idealMoisture[name]) * 1.5;
    const nutrientScore = clamp((Number(values.nitrogen) + Number(values.phosphorus) + Number(values.potassium)) / 2.4, 45, 100);
    const loamBonus = values.soilType === "Loamy" ? 5 : 0;
    const score = Math.round(clamp(phScore * 0.36 + moistureScore * 0.34 + nutrientScore * 0.3 + loamBonus - index * 2, 54, 96));
    return { name, score };
  }).sort((a, b) => b.score - a.score);
}
