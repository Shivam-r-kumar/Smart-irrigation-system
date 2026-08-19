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

export function loadFarmDevices(storage, fallbackDevices) {
  try {
    const stored = JSON.parse(storage.getItem("agrismart-farm-devices-v1") || "null");
    if (!Array.isArray(stored)) return fallbackDevices;
    return stored.filter((device) => device?.id && Number.isFinite(device?.coordinates?.lat) && Number.isFinite(device?.coordinates?.lng));
  } catch {
    return fallbackDevices;
  }
}

export function saveFarmDevices(storage, devices) {
  try {
    storage.setItem("agrismart-farm-devices-v1", JSON.stringify(devices));
    return true;
  } catch {
    return false;
  }
}

export function isPointInsideBoundary(point, boundary) {
  if (!point || !Array.isArray(boundary) || boundary.length < 3) return false;
  let inside = false;
  for (let index = 0, previous = boundary.length - 1; index < boundary.length; previous = index++) {
    const currentPoint = boundary[index];
    const previousPoint = boundary[previous];
    const intersects = ((currentPoint.lat > point.lat) !== (previousPoint.lat > point.lat))
      && (point.lng < (previousPoint.lng - currentPoint.lng) * (point.lat - currentPoint.lat) / (previousPoint.lat - currentPoint.lat) + currentPoint.lng);
    if (intersects) inside = !inside;
  }
  return inside;
}
