import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";
import { useLanguage } from "../context/LanguageContext";
import { calculatePolygonAreaAcres, isPointInsideBoundary } from "../utils/farmMapping";
import { GOOGLE_MAPS_API_KEY, loadGoogleMaps } from "../utils/googleMaps";
import { createDeviceMarkerClass } from "../utils/googleMapOverlays";

const apiKey = GOOGLE_MAPS_API_KEY;

const DEVICE_PRESETS = {
  sensor: {
    color: "#32a363",
    typeKey: "farmMap.deviceTypes.sensorNode",
    prefix: "SENSOR",
    markerPrefix: "S",
    noteKey: "farmMap.deviceNotes.customSensor",
    metrics: [
      { id: "soilMoisture", labelKey: "metrics.soilMoisture", icon: "Droplets", tone: "blue", value: 42, suffix: "%" },
      { id: "humidity", labelKey: "metrics.humidity", icon: "CloudSun", tone: "cyan", value: 64, suffix: "%" },
      { id: "temperature", labelKey: "farmMap.airTemperature", icon: "ThermometerSun", tone: "red", value: 31, suffix: "°C" },
      { id: "soilTemperature", labelKey: "farmMap.soilTemperature", icon: "Thermometer", tone: "amber", value: 28.9, suffix: "°C" },
    ],
  },
  motor: {
    color: "#d19045",
    typeKey: "farmMap.deviceTypes.motorControlUnit",
    prefix: "MOTOR",
    markerPrefix: "M",
    noteKey: "farmMap.deviceNotes.customMotor",
    metrics: [
      { id: "pumpState", labelKey: "metrics.pumpState", icon: "Power", tone: "green", value: false, type: "state" },
      { id: "flowRate", labelKey: "farmMap.flowRate", icon: "Gauge", tone: "blue", value: 0, suffix: " L/min" },
      { id: "pressure", labelKey: "farmMap.pressure", icon: "Activity", tone: "purple", value: 0, suffix: " bar" },
      { id: "runtime", labelKey: "farmMap.runtimeToday", icon: "Clock3", tone: "amber", value: 0, suffix: " min" },
    ],
  },
  gateway: {
    color: "#789276",
    typeKey: "farmMap.deviceTypes.gateway",
    prefix: "GATEWAY",
    markerPrefix: "G",
    noteKey: "farmMap.deviceNotes.customGateway",
    metrics: [
      { id: "signalStrength", labelKey: "farmMap.signalStrength", icon: "Wifi", tone: "green", value: 92, suffix: "%" },
      { id: "connectedDevices", labelKey: "farmMap.connectedDevices", icon: "RadioTower", tone: "blue", value: 0, suffix: "" },
      { id: "uptime", labelKey: "farmMap.uptime", icon: "Clock3", tone: "purple", value: 99.8, suffix: "%" },
      { id: "dataPackets", labelKey: "farmMap.dataPackets", icon: "Network", tone: "cyan", value: 1284, suffix: "" },
    ],
  },
};

function getPathCenter(path) {
  return path.reduce((center, point) => ({
    lat: center.lat + point.lat / path.length,
    lng: center.lng + point.lng / path.length,
  }), { lat: 0, lng: 0 });
}

function getSuggestedId(type, devices) {
  const preset = DEVICE_PRESETS[type];
  let number = devices.filter((device) => device.typeKey === preset.typeKey || device.id.startsWith(preset.prefix)).length + 1;
  let id = `${preset.prefix}-${String(number).padStart(3, "0")}`;
  while (devices.some((device) => device.id === id)) {
    number += 1;
    id = `${preset.prefix}-${String(number).padStart(3, "0")}`;
  }
  return id;
}

function makeDevice(form, devices) {
  const preset = DEVICE_PRESETS[form.type];
  const sameTypeCount = devices.filter((device) => device.typeKey === preset.typeKey).length + 1;
  const metrics = preset.metrics.map((metric) => metric.id === "connectedDevices" ? { ...metric, value: devices.length } : { ...metric });
  return {
    id: form.id.trim().toUpperCase(),
    name: form.name.trim(),
    typeKey: preset.typeKey,
    marker: `${preset.markerPrefix}${sameTypeCount}`,
    color: preset.color,
    status: "online",
    coordinates: { lat: Number(form.lat), lng: Number(form.lng) },
    battery: form.type === "motor" ? 100 : 95,
    signal: 92,
    lastSeen: "Just now",
    metrics,
    noteKey: preset.noteKey,
  };
}

export default function FarmMapperModal({ boundary, devices, onSave, onClose }) {
  const { t } = useLanguage();
  const [step, setStep] = useState("boundary");
  const [boundaryMode, setBoundaryMode] = useState("current");
  const [workingBoundary, setWorkingBoundary] = useState(() => boundary.map((point) => ({ ...point })));
  const [workingDevices, setWorkingDevices] = useState(() => devices.map((device) => ({ ...device, coordinates: { ...device.coordinates } })));
  const [draftPoints, setDraftPoints] = useState([]);
  const [deviceTab, setDeviceTab] = useState("add");
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [form, setForm] = useState(() => ({ type: "sensor", name: "", id: getSuggestedId("sensor", devices), lat: "", lng: "" }));
  const [formError, setFormError] = useState("");
  const [mapStatus, setMapStatus] = useState(apiKey ? "loading" : "missing-key");
  const mapNodeRef = useRef(null);
  const mapRef = useRef(null);
  const mapsRef = useRef(null);
  const DeviceMarkerRef = useRef(null);
  const boundaryPolygonRef = useRef(null);
  const drawingLineRef = useRef(null);
  const deviceMarkersRef = useRef([]);
  const previewPointRef = useRef(null);

  const boundaryArea = useMemo(() => calculatePolygonAreaAcres(boundaryMode === "drawing" ? draftPoints : workingBoundary), [boundaryMode, draftPoints, workingBoundary]);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.classList.remove("modal-open");
    };
  }, [onClose]);

  useEffect(() => {
    if (!apiKey || !mapNodeRef.current) return undefined;
    let disposed = false;
    loadGoogleMaps(apiKey).then((maps) => {
      if (disposed || !mapNodeRef.current) return;
      const map = new maps.Map(mapNodeRef.current, {
        center: getPathCenter(workingBoundary),
        zoom: 18,
        mapTypeId: maps.MapTypeId.SATELLITE,
        tilt: 0,
        heading: 0,
        fullscreenControl: false,
        mapTypeControl: true,
        mapTypeControlOptions: { mapTypeIds: [maps.MapTypeId.SATELLITE, maps.MapTypeId.HYBRID] },
        streetViewControl: false,
        zoomControl: true,
        clickableIcons: false,
        gestureHandling: "greedy",
      });
      mapRef.current = map;
      mapsRef.current = maps;
      DeviceMarkerRef.current = createDeviceMarkerClass(maps);
      const bounds = new maps.LatLngBounds();
      workingBoundary.forEach((point) => bounds.extend(point));
      map.fitBounds(bounds, 48);
      setMapStatus("ready");
    }).catch(() => {
      if (!disposed) setMapStatus("error");
    });
    return () => {
      disposed = true;
      boundaryPolygonRef.current?.setMap(null);
      drawingLineRef.current?.setMap(null);
      previewPointRef.current?.setMap(null);
      deviceMarkersRef.current.forEach((marker) => marker.setMap(null));
      mapRef.current = null;
      mapsRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapStatus !== "ready" || !mapRef.current || !mapsRef.current) return;
    boundaryPolygonRef.current?.setMap(null);
    drawingLineRef.current?.setMap(null);
    boundaryPolygonRef.current = null;
    drawingLineRef.current = null;

    if (boundaryMode === "drawing") {
      drawingLineRef.current = new mapsRef.current.Polyline({
        path: draftPoints,
        map: mapRef.current,
        strokeColor: "#66f08a",
        strokeOpacity: 1,
        strokeWeight: 4,
        clickable: false,
        zIndex: 20,
      });
      return;
    }

    boundaryPolygonRef.current = new mapsRef.current.Polygon({
      paths: workingBoundary,
      map: mapRef.current,
      strokeColor: "#66f08a",
      strokeOpacity: 1,
      strokeWeight: 4,
      fillColor: "#39a95c",
      fillOpacity: 0.18,
      editable: boundaryMode === "review" && step === "boundary",
      clickable: false,
      zIndex: 10,
    });
  }, [boundaryMode, draftPoints, mapStatus, step, workingBoundary]);

  useEffect(() => {
    if (mapStatus !== "ready" || !mapRef.current) return undefined;
    const listener = mapRef.current.addListener("click", (event) => {
      if (!event.latLng) return;
      const point = event.latLng.toJSON();
      if (step === "boundary" && boundaryMode === "drawing") {
        setDraftPoints((current) => [...current, point]);
      }
      if (step === "devices" && deviceTab === "add") {
        setForm((current) => ({ ...current, lat: point.lat.toFixed(6), lng: point.lng.toFixed(6) }));
        setFormError("");
      }
    });
    mapRef.current.setOptions({ draggableCursor: step === "boundary" && boundaryMode === "drawing" ? "crosshair" : step === "devices" && deviceTab === "add" ? "crosshair" : null });
    return () => listener.remove();
  }, [boundaryMode, deviceTab, mapStatus, step]);

  useEffect(() => {
    if (mapStatus !== "ready" || !mapRef.current || !DeviceMarkerRef.current) return;
    deviceMarkersRef.current.forEach((marker) => marker.setMap(null));
    const DeviceMarker = DeviceMarkerRef.current;
    deviceMarkersRef.current = workingDevices.map((device) => {
      const marker = new DeviceMarker(device, device.id === selectedDeviceId, () => {
        setSelectedDeviceId(device.id);
        if (step === "devices") setDeviceTab("manage");
      });
      marker.setMap(mapRef.current);
      return marker;
    });
  }, [mapStatus, selectedDeviceId, step, workingDevices]);

  useEffect(() => {
    if (mapStatus !== "ready" || !mapRef.current || !mapsRef.current) return;
    previewPointRef.current?.setMap(null);
    previewPointRef.current = null;
    const lat = Number(form.lat);
    const lng = Number(form.lng);
    if (step !== "devices" || deviceTab !== "add" || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    previewPointRef.current = new mapsRef.current.Circle({
      center: { lat, lng },
      radius: 4,
      map: mapRef.current,
      strokeColor: DEVICE_PRESETS[form.type].color,
      strokeOpacity: 1,
      strokeWeight: 3,
      fillColor: DEVICE_PRESETS[form.type].color,
      fillOpacity: 0.72,
      zIndex: 30,
    });
  }, [deviceTab, form.lat, form.lng, form.type, mapStatus, step]);

  const startDrawing = () => {
    setBoundaryMode("drawing");
    setDraftPoints([]);
    setFormError("");
  };

  const finishDrawing = () => {
    if (draftPoints.length < 3) return;
    setWorkingBoundary(draftPoints);
    setBoundaryMode("review");
  };

  const continueToDevices = () => {
    const nextBoundary = boundaryMode === "review" && boundaryPolygonRef.current
      ? boundaryPolygonRef.current.getPath().getArray().map((point) => point.toJSON())
      : workingBoundary;
    if (nextBoundary.length < 3) return;
    setWorkingBoundary(nextBoundary);
    setBoundaryMode("current");
    setStep("devices");
  };

  const changeDeviceType = (type) => {
    setForm((current) => ({ ...current, type, id: getSuggestedId(type, workingDevices) }));
    setFormError("");
  };

  const addDevice = (event) => {
    event.preventDefault();
    const lat = Number(form.lat);
    const lng = Number(form.lng);
    if (!form.name.trim() || !form.id.trim() || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      setFormError(t("farmMap.coordinateRequired"));
      return;
    }
    if (workingDevices.some((device) => device.id.toLowerCase() === form.id.trim().toLowerCase())) {
      setFormError(t("farmMap.duplicateDevice"));
      return;
    }
    if (!isPointInsideBoundary({ lat, lng }, workingBoundary)) {
      setFormError(t("farmMap.outsideBoundary"));
      return;
    }
    const device = makeDevice(form, workingDevices);
    const nextDevices = [...workingDevices, device];
    setWorkingDevices(nextDevices);
    setSelectedDeviceId(device.id);
    setForm({ type: form.type, name: "", id: getSuggestedId(form.type, nextDevices), lat: "", lng: "" });
    setFormError("");
  };

  const deleteDevice = (id) => {
    setWorkingDevices((current) => current.filter((device) => device.id !== id));
    if (selectedDeviceId === id) setSelectedDeviceId(null);
  };

  return createPortal((
    <div className="farm-mapper-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="farm-mapper-modal" role="dialog" aria-modal="true" aria-labelledby="farm-mapper-title">
        <header className="farm-mapper-header">
          <span className="mapper-title-icon"><Icon name="Map" size={21} /></span>
          <div><h2 id="farm-mapper-title">{t("farmMap.mapperTitle")}</h2><p>{t("farmMap.mapperSubtitle")}</p></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label={t("farmMap.closeMapper")}><Icon name="X" size={19} /></button>
        </header>

        <nav className="mapper-step-tabs" aria-label={t("farmMap.mapperTitle")}>
          <button type="button" className={step === "boundary" ? "active" : "done"} onClick={() => setStep("boundary")}><b>1</b><span>{t("farmMap.boundaryStep")}</span></button>
          <button type="button" className={step === "devices" ? "active" : ""} onClick={continueToDevices}><b>2</b><span>{t("farmMap.devicesStep")}</span></button>
        </nav>

        <div className="mapper-workspace">
          <aside className="mapper-control-panel">
            {step === "boundary" ? (
              <div className="mapper-panel-stack">
                <div className="mapper-section-heading"><span><Icon name="Spline" size={18} /></span><div><h3>{t("farmMap.currentBoundary")}</h3><p>{t("farmMap.currentBoundaryHelp")}</p></div></div>
                <div className="mapper-boundary-summary"><span><small>{t("farmMap.boundaryPoints")}</small><strong>{boundaryMode === "drawing" ? draftPoints.length : workingBoundary.length}</strong></span><span><small>{t("farmMap.area")}</small><strong>{boundaryArea} {t("farmMap.acres")}</strong></span></div>

                {boundaryMode === "current" && <div className="mapper-choice-grid"><button className="mapper-choice primary-choice" type="button" onClick={continueToDevices}><Icon name="Route" size={21} /><span><strong>{t("farmMap.useCurrentBoundary")}</strong><small>{t("farmMap.useCurrentBoundaryHelp")}</small></span><Icon name="ArrowRight" size={17} /></button><button className="mapper-choice" type="button" onClick={startDrawing}><Icon name="PencilRuler" size={21} /><span><strong>{t("farmMap.drawNewBoundary")}</strong><small>{t("farmMap.clickCorners")}</small></span><Icon name="ChevronRight" size={17} /></button></div>}

                {boundaryMode === "drawing" && <><div className="mapper-instruction"><Icon name="Crosshair" size={18} /><span><strong>{t("farmMap.mappingBoundary")}</strong><small>{t("farmMap.clickCorners")}</small></span></div><div className="mapper-action-row"><button className="button secondary" type="button" onClick={() => setDraftPoints((points) => points.slice(0, -1))} disabled={!draftPoints.length}><Icon name="Undo2" size={15} />{t("farmMap.undoPoint")}</button><button className="button primary" type="button" onClick={finishDrawing} disabled={draftPoints.length < 3}><Icon name="Check" size={15} />{t("farmMap.finish")}</button></div><button className="button ghost mapper-full-button" type="button" onClick={() => { setBoundaryMode("current"); setDraftPoints([]); }}><Icon name="X" size={15} />{t("common.cancel")}</button></>}

                {boundaryMode === "review" && <><div className="mapper-instruction success"><Icon name="Move3D" size={18} /><span><strong>{t("farmMap.adjustBeforeSave")}</strong><small>{t("farmMap.dragVertices")}</small></span></div><button className="button primary mapper-full-button" type="button" onClick={continueToDevices}><Icon name="Save" size={15} />{t("farmMap.saveAndContinue")}</button><button className="button ghost mapper-full-button" type="button" onClick={startDrawing}><Icon name="RotateCcw" size={15} />{t("farmMap.drawAgain")}</button></>}
              </div>
            ) : (
              <div className="mapper-panel-stack devices-panel-stack">
                <div className="mapper-section-heading"><span><Icon name="RadioTower" size={18} /></span><div><h3>{t("farmMap.deviceSetup")}</h3><p>{t("farmMap.deviceSetupHelp")}</p></div></div>
                <div className="mapper-device-tabs"><button type="button" className={deviceTab === "add" ? "active" : ""} onClick={() => setDeviceTab("add")}><Icon name="Plus" size={15} />{t("farmMap.addDevice")}</button><button type="button" className={deviceTab === "manage" ? "active" : ""} onClick={() => setDeviceTab("manage")}><Icon name="Trash2" size={15} />{t("farmMap.deleteDevice")}<b>{workingDevices.length}</b></button></div>

                {deviceTab === "add" ? <form className="mapper-device-form" onSubmit={addDevice}>
                  <label><span>{t("farmMap.deviceType")}</span><select value={form.type} onChange={(event) => changeDeviceType(event.target.value)}><option value="sensor">{t("farmMap.deviceTypes.soilNode")}</option><option value="motor">{t("farmMap.deviceTypes.motorControlUnit")}</option><option value="gateway">{t("farmMap.deviceTypes.gateway")}</option></select></label>
                  <label><span>{t("farmMap.deviceName")}</span><input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder={t("farmMap.deviceNamePlaceholder")} /></label>
                  <label><span>{t("farmMap.deviceId")}</span><input value={form.id} onChange={(event) => setForm((current) => ({ ...current, id: event.target.value }))} /></label>
                  <div className="mapper-map-hint"><Icon name="MapPin" size={17} /><span><strong>{t("farmMap.chooseOnMap")}</strong><small>{t("farmMap.mapClickHelp")}</small></span></div>
                  <div className="mapper-coordinate-grid"><label><span>{t("farmMap.latitude")}</span><input type="number" step="any" value={form.lat} onChange={(event) => setForm((current) => ({ ...current, lat: event.target.value }))} placeholder="30.900650" /></label><label><span>{t("farmMap.longitude")}</span><input type="number" step="any" value={form.lng} onChange={(event) => setForm((current) => ({ ...current, lng: event.target.value }))} placeholder="75.857050" /></label></div>
                  <small className="manual-coordinate-note"><Icon name="Keyboard" size={13} />{t("farmMap.manualCoordinates")}</small>
                  {formError && <div className="mapper-form-error"><Icon name="TriangleAlert" size={15} />{formError}</div>}
                  <button className="button primary mapper-full-button" type="submit"><Icon name="Plus" size={15} />{t("farmMap.addThisDevice")}</button>
                </form> : <div className="mapper-device-manager">
                  {workingDevices.length ? workingDevices.map((device) => <div key={device.id} className={device.id === selectedDeviceId ? "selected" : ""} style={{ "--device-color": device.color }}><button type="button" className="device-manager-select" onClick={() => { setSelectedDeviceId(device.id); mapRef.current?.panTo(device.coordinates); }}><b>{device.marker}</b><span><strong>{device.name}</strong><small>{device.id}<em>{device.coordinates.lat.toFixed(5)}, {device.coordinates.lng.toFixed(5)}</em></small></span></button><button type="button" className="device-delete-button" onClick={() => deleteDevice(device.id)} aria-label={`${t("farmMap.deleteDevice")} ${device.name}`}><Icon name="Trash2" size={15} /></button></div>) : <div className="mapper-empty-state"><Icon name="RadioTower" size={27} /><strong>{t("farmMap.noDevices")}</strong><button className="button secondary small" type="button" onClick={() => setDeviceTab("add")}>{t("farmMap.addDevice")}</button></div>}
                </div>}
              </div>
            )}
          </aside>

          <div className="mapper-map-pane">
            <div ref={mapNodeRef} className="mapper-google-map" aria-label={t("farmMap.satelliteAlt")} />
            {mapStatus === "loading" && <div className="map-load-state"><i />{t("farmMap.loadingMap")}</div>}
            {mapStatus === "missing-key" && <div className="map-key-state"><Icon name="MapPinned" size={30} /><h2>{t("farmMap.keyNeeded")}</h2><p>{t("farmMap.keyHelp")}</p><code>VITE_GOOGLE_MAPS_API_KEY</code></div>}
            {mapStatus === "error" && <div className="map-key-state error"><Icon name="TriangleAlert" size={30} /><h2>{t("farmMap.mapError")}</h2><p>{t("farmMap.mapErrorHelp")}</p></div>}
            <div className="mapper-map-mode-chip"><Icon name={step === "boundary" ? "Spline" : "MapPin"} size={15} /><span>{step === "boundary" ? t("farmMap.boundaryStep") : deviceTab === "add" ? t("farmMap.chooseOnMap") : `${workingDevices.length} ${t("farmMap.devices")}`}</span></div>
          </div>
        </div>

        <footer className="farm-mapper-footer"><button className="button secondary" type="button" onClick={step === "devices" ? () => setStep("boundary") : onClose}><Icon name="ArrowLeft" size={15} />{step === "devices" ? t("farmMap.backToBoundary") : t("common.cancel")}</button><span><Icon name="Database" size={14} />{workingBoundary.length} {t("farmMap.boundaryPoints")} · {workingDevices.length} {t("farmMap.devices")}</span><button className="button primary" type="button" onClick={() => onSave(workingBoundary, workingDevices)} disabled={step !== "devices"}><Icon name="Save" size={15} />{t("farmMap.saveMapping")}</button></footer>
      </section>
    </div>
  ), document.body);
}
