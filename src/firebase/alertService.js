import { onValue, query, ref, limitToLast } from "firebase/database";
import { database, firebaseEnabled } from "./config";

export function subscribeToAlerts(deviceId, onData, onError) {
  if (!firebaseEnabled || !database) return () => {};
  const alertQuery = query(ref(database, `alerts/${deviceId}`), limitToLast(25));
  return onValue(alertQuery, (snapshot) => onData(snapshot.val() || {}), onError);
}
