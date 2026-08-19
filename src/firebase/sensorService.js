import { get, onValue, ref } from "firebase/database";
import { database, firebaseEnabled } from "./config";

export function subscribeToSensorData(deviceId, onData, onError) {
  if (!firebaseEnabled || !database) return () => {};
  const sensorRef = ref(database, `sensorReadings/${deviceId}`);
  return onValue(
    sensorRef,
    (snapshot) => onData(snapshot.exists() ? snapshot.val() : null),
    onError,
  );
}

export async function fetchSensorHistory(deviceId, dateKey) {
  if (!firebaseEnabled || !database) return [];
  const snapshot = await get(ref(database, `sensorHistory/${deviceId}/${dateKey}`));
  if (!snapshot.exists()) return [];

  return Object.entries(snapshot.val())
    .map(([id, reading]) => ({ id, ...reading }))
    .sort((a, b) => new Date(a.timestamp ?? a.id).getTime() - new Date(b.timestamp ?? b.id).getTime());
}
