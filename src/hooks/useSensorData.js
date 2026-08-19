import { useFarm } from "../context/FarmContext";

export function useSensorData() {
  const { sensorData, connection } = useFarm();
  return { data: sensorData, loading: connection === "connecting", error: connection === "error", connection };
}
