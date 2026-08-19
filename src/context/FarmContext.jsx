"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { subscribeToSensorData } from "../firebase/sensorService";
import { setAllMotorStates, setAutoMode, setMotorState, subscribeToMotorStates, syncMotorRegistry } from "../firebase/irrigationService";
import { saveSharedFarmMapping, subscribeToFarmMapping } from "../firebase/mappingService";
import { firebaseEnabled } from "../firebase/config";
import farmMapData from "../data/farmMap.json";
import { getMotorDefaultPumpState, isMotorDevice, loadFarmBoundary, loadFarmDevices, saveFarmBoundary, saveFarmDevices } from "../utils/farmMapping";

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
  const [autoModeLoading, setAutoModeLoading] = useState(false);
  const [motorLoadingIds, setMotorLoadingIds] = useState([]);
  const [motorStates, setMotorStates] = useState({});
  const [farmBoundary, setFarmBoundary] = useState(() => typeof window === "undefined" ? farmMapData.boundary : loadFarmBoundary(window.localStorage, farmMapData.boundary));
  const [farmDevices, setFarmDevices] = useState(() => typeof window === "undefined" ? farmMapData.devices : loadFarmDevices(window.localStorage, farmMapData.devices));
  const motorDevices = useMemo(() => farmDevices.filter(isMotorDevice), [farmDevices]);
  const motorDeviceIds = useMemo(() => motorDevices.map((device) => device.id), [motorDevices]);
  const motorDeviceKey = motorDeviceIds.join("|");

  useEffect(() => subscribeToSensorData(
    demoSensorData.deviceId,
    (data) => {
      if (data) setSensorData((current) => ({ ...current, ...data }));
      setConnection(data ? "live" : "demo");
    },
    () => setConnection("error"),
  ), []);

  useEffect(() => {
    const syncMappingAcrossTabs = (event) => {
      if (event.key === "agrismart-farm-boundary-v1") setFarmBoundary(loadFarmBoundary(window.localStorage, farmMapData.boundary));
      if (event.key === "agrismart-farm-devices-v1") setFarmDevices(loadFarmDevices(window.localStorage, farmMapData.devices));
    };
    window.addEventListener("storage", syncMappingAcrossTabs);
    return () => window.removeEventListener("storage", syncMappingAcrossTabs);
  }, []);

  useEffect(() => subscribeToFarmMapping(
    (mapping) => {
      setFarmBoundary(mapping.boundary);
      setFarmDevices(mapping.devices);
      saveFarmBoundary(window.localStorage, mapping.boundary);
      saveFarmDevices(window.localStorage, mapping.devices);
    },
    () => {
      void saveSharedFarmMapping(farmBoundary, farmDevices).catch(() => {});
    },
    () => {},
  ), []);

  useEffect(() => subscribeToMotorStates(
    motorDeviceIds,
    (states) => setMotorStates(states),
    () => {},
  ), [motorDeviceKey]);

  const updateFarmMapping = useCallback((nextBoundary, nextDevices) => {
    const previousDevices = farmDevices;
    setFarmBoundary(nextBoundary);
    setFarmDevices(nextDevices);
    saveFarmBoundary(window.localStorage, nextBoundary);
    saveFarmDevices(window.localStorage, nextDevices);
    void saveSharedFarmMapping(nextBoundary, nextDevices).catch(() => {});
    void syncMotorRegistry(previousDevices, nextDevices).catch(() => {});
  }, [farmDevices]);

  const getMotorPumpState = useCallback((deviceOrId) => {
    const device = typeof deviceOrId === "string"
      ? motorDevices.find((item) => item.id === deviceOrId)
      : deviceOrId;
    if (!device) return false;
    return motorStates[device.id]?.pumpState ?? getMotorDefaultPumpState(device);
  }, [motorDevices, motorStates]);

  const runningMotorCount = useMemo(() => motorDevices.filter((device) => getMotorPumpState(device)).length, [getMotorPumpState, motorDevices]);

  const controlMotor = useCallback(async (deviceId, nextState) => {
    if (!motorDevices.some((device) => device.id === deviceId)) return;
    setMotorLoadingIds((current) => Array.from(new Set([...current, deviceId])));
    try {
      await setMotorState(deviceId, nextState);
      setMotorStates((current) => ({ ...current, [deviceId]: { ...current[deviceId], pumpState: nextState, updatedAt: new Date().toISOString() } }));
    } finally {
      setMotorLoadingIds((current) => current.filter((id) => id !== deviceId));
    }
  }, [motorDevices]);

  const controlAllMotors = useCallback(async (nextState) => {
    const deviceIds = motorDevices.map((device) => device.id);
    if (!deviceIds.length) return;
    setMotorLoadingIds((current) => Array.from(new Set([...current, ...deviceIds])));
    try {
      await setAllMotorStates(deviceIds, nextState);
      const updatedAt = new Date().toISOString();
      setMotorStates((current) => Object.fromEntries([
        ...Object.entries(current),
        ...deviceIds.map((deviceId) => [deviceId, { ...current[deviceId], pumpState: nextState, updatedAt }]),
      ]));
      setSensorData((current) => ({ ...current, pumpState: nextState, lastUpdated: updatedAt }));
    } finally {
      setMotorLoadingIds((current) => current.filter((id) => !deviceIds.includes(id)));
    }
  }, [motorDevices]);

  const toggleAutoMode = async () => {
    const next = !sensorData.autoMode;
    setAutoModeLoading(true);
    try {
      await setAutoMode(sensorData.deviceId, next);
      setSensorData((current) => ({ ...current, autoMode: next, lastUpdated: new Date().toISOString() }));
    } finally {
      setAutoModeLoading(false);
    }
  };

  const controlLoading = autoModeLoading || motorLoadingIds.length > 0;
  const value = useMemo(() => ({
    sensorData,
    connection,
    controlLoading,
    motorLoadingIds,
    motorStates,
    motorDevices,
    runningMotorCount,
    getMotorPumpState,
    controlMotor,
    controlAllMotors,
    toggleAutoMode,
    farmBoundary,
    farmDevices,
    updateFarmMapping,
  }), [sensorData, connection, controlLoading, motorLoadingIds, motorStates, motorDevices, runningMotorCount, getMotorPumpState, controlMotor, controlAllMotors, farmBoundary, farmDevices, updateFarmMapping]);
  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>;
}

export const useFarm = () => useContext(FarmContext);
