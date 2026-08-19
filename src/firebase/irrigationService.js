import { ref, update } from "firebase/database";
import { database, firebaseEnabled } from "./config";

async function updateIrrigation(deviceId, patch) {
  if (!firebaseEnabled || !database) {
    await new Promise((resolve) => setTimeout(resolve, 450));
    return patch;
  }
  await update(ref(database, `irrigation/${deviceId}`), patch);
  return patch;
}

export const setPumpState = (deviceId, pumpState) => updateIrrigation(deviceId, { pumpState });
export const setAutoMode = (deviceId, autoMode) => updateIrrigation(deviceId, { autoMode });
