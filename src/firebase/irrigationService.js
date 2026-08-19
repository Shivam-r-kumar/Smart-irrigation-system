import { onValue, ref, update } from "firebase/database";
import { database, firebaseEnabled } from "./config";
import { isMotorDevice } from "../utils/farmMapping";

const IRRIGATION_PATH = "irrigation";

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

export function subscribeToMotorStates(deviceIds, onData, onError) {
  if (!firebaseEnabled || !database || !deviceIds.length) return () => {};
  const wantedIds = new Set(deviceIds);
  return onValue(
    ref(database, IRRIGATION_PATH),
    (snapshot) => {
      const irrigation = snapshot.exists() ? snapshot.val() : {};
      const states = Object.fromEntries(Object.entries(irrigation || {})
        .filter(([deviceId]) => wantedIds.has(deviceId))
        .map(([deviceId, state]) => [deviceId, {
          pumpState: Boolean(state?.pumpState),
          autoMode: Boolean(state?.autoMode),
          updatedAt: state?.updatedAt || null,
        }]));
      onData(states);
    },
    onError,
  );
}

export async function setMotorState(deviceId, pumpState) {
  return updateIrrigation(deviceId, {
    deviceId,
    pumpState,
    updatedAt: new Date().toISOString(),
  });
}

export async function setAllMotorStates(deviceIds, pumpState) {
  if (!deviceIds.length) return {};
  const updatedAt = new Date().toISOString();
  const patch = {};
  deviceIds.forEach((deviceId) => {
    patch[`${deviceId}/deviceId`] = deviceId;
    patch[`${deviceId}/pumpState`] = pumpState;
    patch[`${deviceId}/updatedAt`] = updatedAt;
  });

  if (!firebaseEnabled || !database) {
    await new Promise((resolve) => setTimeout(resolve, 450));
    return patch;
  }
  await update(ref(database, IRRIGATION_PATH), patch);
  return patch;
}

export async function syncMotorRegistry(previousDevices, nextDevices) {
  if (!firebaseEnabled || !database) return false;
  const previousMotors = previousDevices.filter(isMotorDevice);
  const nextMotors = nextDevices.filter(isMotorDevice);
  const previousIds = new Set(previousMotors.map((device) => device.id));
  const nextIds = new Set(nextMotors.map((device) => device.id));
  const patch = {};
  const updatedAt = new Date().toISOString();

  nextMotors.forEach((device) => {
    patch[`${device.id}/deviceId`] = device.id;
    patch[`${device.id}/deviceName`] = device.name;
    patch[`${device.id}/registered`] = true;
    if (!previousIds.has(device.id)) {
      patch[`${device.id}/pumpState`] = false;
      patch[`${device.id}/autoMode`] = false;
      patch[`${device.id}/updatedAt`] = updatedAt;
    }
  });
  previousMotors.forEach((device) => {
    if (!nextIds.has(device.id)) patch[device.id] = null;
  });
  if (!Object.keys(patch).length) return true;
  patch.registryUpdatedAt = updatedAt;
  await update(ref(database, IRRIGATION_PATH), patch);
  return true;
}
