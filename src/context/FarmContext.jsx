"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { subscribeToSensorData } from "../firebase/sensorService";
import { setAutoMode, setPumpState } from "../firebase/irrigationService";
import { firebaseEnabled } from "../firebase/config";

const demoSensorData = {
  deviceId: "FIELD-001", soilMoisture: 42, temperature: 31, humidity: 64,
  lightIntensity: 18500, waterTankLevel: 78, soilPH: 6.5, ec: 0.72,
  nitrogen: 120, phosphorus: 60, potassium: 40, pumpState: true,
  autoMode: true, rainProbability: 68, lastUpdated: new Date().toISOString(),
};

const FarmContext = createContext(null);

export function FarmProvider({ children }) {
  const [sensorData, setSensorData] = useState(demoSensorData);
  const [connection, setConnection] = useState(firebaseEnabled ? "connecting" : "demo");
  const [controlLoading, setControlLoading] = useState(false);

  useEffect(() => subscribeToSensorData(
    demoSensorData.deviceId,
    (data) => {
      if (data) setSensorData((current) => ({ ...current, ...data }));
      setConnection(data ? "live" : "demo");
    },
    () => setConnection("error"),
  ), []);

  const controlPump = async (nextState) => {
    setControlLoading(true);
    try {
      await setPumpState(sensorData.deviceId, nextState);
      setSensorData((current) => ({ ...current, pumpState: nextState, lastUpdated: new Date().toISOString() }));
    } finally {
      setControlLoading(false);
    }
  };

  const toggleAutoMode = async () => {
    const next = !sensorData.autoMode;
    setControlLoading(true);
    try {
      await setAutoMode(sensorData.deviceId, next);
      setSensorData((current) => ({ ...current, autoMode: next, lastUpdated: new Date().toISOString() }));
    } finally {
      setControlLoading(false);
    }
  };

  const value = useMemo(() => ({ sensorData, connection, controlLoading, controlPump, toggleAutoMode }), [sensorData, connection, controlLoading]);
  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>;
}

export const useFarm = () => useContext(FarmContext);
