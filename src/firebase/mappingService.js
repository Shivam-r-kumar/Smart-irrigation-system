import { onValue, ref, set } from "firebase/database";
import { database, firebaseEnabled } from "./config";

const SHARED_MAPPING_PATH = "farmMapping/default";

function isValidBoundary(boundary) {
  return Array.isArray(boundary)
    && boundary.length >= 3
    && boundary.every((point) => Number.isFinite(point?.lat) && Number.isFinite(point?.lng));
}

function isValidDevices(devices) {
  return Array.isArray(devices)
    && devices.every((device) => device?.id
      && Number.isFinite(device?.coordinates?.lat)
      && Number.isFinite(device?.coordinates?.lng));
}

export function subscribeToFarmMapping(onMapping, onMissing, onError) {
  if (!firebaseEnabled || !database) return () => {};
  return onValue(
    ref(database, SHARED_MAPPING_PATH),
    (snapshot) => {
      if (!snapshot.exists()) {
        onMissing?.();
        return;
      }
      const mapping = snapshot.val();
      if (isValidBoundary(mapping?.boundary) && isValidDevices(mapping?.devices)) onMapping(mapping);
      else onMissing?.();
    },
    onError,
  );
}

export async function saveSharedFarmMapping(boundary, devices) {
  if (!firebaseEnabled || !database || !isValidBoundary(boundary) || !isValidDevices(devices)) return false;
  await set(ref(database, SHARED_MAPPING_PATH), {
    boundary,
    devices,
    updatedAt: new Date().toISOString(),
  });
  return true;
}
