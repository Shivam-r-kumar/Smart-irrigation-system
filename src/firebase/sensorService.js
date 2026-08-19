import { onValue, ref } from "firebase/database";
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
