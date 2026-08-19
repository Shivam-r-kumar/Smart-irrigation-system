const EARTH_RADIUS_METRES = 6378137;
const SQUARE_METRES_PER_ACRE = 4046.8564224;

export function calculatePolygonAreaAcres(path) {
  if (!Array.isArray(path) || path.length < 3) return 0;
  const averageLatitude = path.reduce((sum, point) => sum + point.lat, 0) / path.length;
  const latitudeRadians = averageLatitude * Math.PI / 180;
  const projected = path.map((point) => ({
    x: EARTH_RADIUS_METRES * point.lng * Math.PI / 180 * Math.cos(latitudeRadians),
    y: EARTH_RADIUS_METRES * point.lat * Math.PI / 180,
  }));
  const squareMetres = Math.abs(projected.reduce((sum, point, index) => {
    const next = projected[(index + 1) % projected.length];
    return sum + point.x * next.y - next.x * point.y;
  }, 0)) / 2;
  return Number((squareMetres / SQUARE_METRES_PER_ACRE).toFixed(2));
}

export function loadFarmBoundary(storage, fallbackBoundary) {
  try {
    const stored = JSON.parse(storage.getItem("agrismart-farm-boundary-v1") || "null");
    if (!Array.isArray(stored) || stored.length < 3) return fallbackBoundary;
    return stored;
  } catch {
    return fallbackBoundary;
  }
}

export function saveFarmBoundary(storage, boundary) {
  try {
    storage.setItem("agrismart-farm-boundary-v1", JSON.stringify(boundary));
    return true;
  } catch {
    return false;
  }
}
