export function getSoilRemedies(values) {
  const remedies = [];
  const phosphorus = Number(values.phosphorus);
  const soilPH = Number(values.soilPH);

  if (Number.isFinite(phosphorus) && phosphorus < 70) {
    remedies.push({ id: "phosphorus", tone: "warning", titleKey: "remedies.lowPhosphorus", detailKey: "remedies.lowPhosphorusAction" });
  }

  if (Number.isFinite(soilPH) && soilPH < 6.8) {
    remedies.push({ id: "acidity", tone: "purple", titleKey: "remedies.acidicSoil", detailKey: "remedies.acidicSoilAction" });
  }

  if (!remedies.length) {
    remedies.push({ id: "balanced", tone: "success", titleKey: "remedies.balanced", detailKey: "remedies.balancedAction" });
  }

  return remedies;
}
