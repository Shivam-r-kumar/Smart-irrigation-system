import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, MapPinned, Satellite } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Icon from "../components/Icon";
import farmMapData from "../data/farmMap.json";
import { useLanguage } from "../context/LanguageContext";
import { useSensorData } from "../hooks/useSensorData";
import { calculatePolygonAreaAcres, loadFarmBoundary, saveFarmBoundary } from "../utils/farmMapping";
import { loadGoogleMaps } from "../utils/googleMaps";

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const farmCenter = farmMapData.farm.coordinates;

function getPathCenter(path) {
  return path.reduce((center, point) => ({ lat: center.lat + point.lat / path.length, lng: center.lng + point.lng / path.length }), { lat: 0, lng: 0 });
}

function createDeviceMarkerClass(maps) {
  return class DeviceMarker extends maps.OverlayView {
    constructor(device, selected, onClick) {
      super();
      this.device = device;
      this.selected = selected;
      this.onClick = onClick;
      this.element = null;
    }

    onAdd() {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `google-device-marker ${this.selected ? "selected" : ""}`;
      button.style.setProperty("--device-color", this.device.color);
      button.setAttribute("aria-label", `${this.device.name}, ${this.device.id}`);
      const marker = document.createElement("strong");
      const markerLabel = document.createElement("span");
      markerLabel.textContent = this.device.marker;
      marker.appendChild(markerLabel);
      const caption = document.createElement("small");
      caption.textContent = this.device.id;
      button.append(marker, caption);
      button.addEventListener("click", this.onClick);
      this.element = button;
      this.getPanes().overlayMouseTarget.appendChild(button);
    }

    draw() {
      if (!this.element) return;
      const pixel = this.getProjection().fromLatLngToDivPixel(this.device.coordinates);
      this.element.style.left = `${pixel.x}px`;
      this.element.style.top = `${pixel.y}px`;
    }

    onRemove() {
      if (!this.element) return;
      this.element.removeEventListener("click", this.onClick);
      this.element.remove();
      this.element = null;
    }
  };
}

export default function FarmMap() {
  const { t } = useLanguage();
  const { data, connection } = useSensorData();
  const [boundary, setBoundary] = useState(() => typeof window === "undefined" ? farmMapData.boundary : loadFarmBoundary(window.localStorage, farmMapData.boundary));
  const [selectedDeviceId, setSelectedDeviceId] = useState(farmMapData.devices[0].id);
  const [mapStatus, setMapStatus] = useState(apiKey ? "loading" : "missing-key");
  const [mappingMode, setMappingMode] = useState("idle");
  const [draftPoints, setDraftPoints] = useState([]);
  const mapNodeRef = useRef(null);
  const mapRef = useRef(null);
  const mapsApiRef = useRef(null);
  const DeviceMarkerRef = useRef(null);
  const boundaryPolygonRef = useRef(null);
  const deviceMarkerRefs = useRef([]);
  const draftLineRef = useRef(null);
  const draftPolygonRef = useRef(null);
  const draftPathListenersRef = useRef([]);
  const mappingModeRef = useRef("idle");
  const hasFittedMapRef = useRef(false);

  const selectedDevice = farmMapData.devices.find((device) => device.id === selectedDeviceId) || farmMapData.devices[0];
  const boundaryArea = useMemo(() => calculatePolygonAreaAcres(boundary), [boundary]);
  const draftArea = useMemo(() => calculatePolygonAreaAcres(draftPoints), [draftPoints]);
  const displayedMetrics = useMemo(() => selectedDevice.metrics.map((metric) => {
    let value = metric.value;
    if (selectedDevice.id === "FIELD-001" && metric.id !== "soilTemperature" && data[metric.id] !== undefined) value = data[metric.id];
    if (selectedDevice.id === "PUMP-A01" && metric.id === "pumpState") value = Boolean(data.pumpState);
    if (selectedDevice.id === "TANK-001" && metric.id === "waterTankLevel" && data.waterTankLevel !== undefined) value = data.waterTankLevel;
    return { ...metric, value };
  }), [data, selectedDevice]);

  useEffect(() => {
    mappingModeRef.current = mappingMode;
    if (!mapRef.current) return;
    const active = mappingMode !== "idle";
    mapRef.current.setOptions({ draggableCursor: active ? "crosshair" : null, disableDoubleClickZoom: active });
    boundaryPolygonRef.current?.setVisible(!active);
  }, [mappingMode]);

  useEffect(() => {
    if (!apiKey || !mapNodeRef.current) return undefined;
    let disposed = false;
    let mapClickListener;

    loadGoogleMaps(apiKey).then((maps) => {
      if (disposed || !mapNodeRef.current) return;
      const map = new maps.Map(mapNodeRef.current, {
        center: farmCenter,
        zoom: 18,
        mapTypeId: maps.MapTypeId.SATELLITE,
        tilt: 0,
        heading: 0,
        fullscreenControl: true,
        mapTypeControl: true,
        mapTypeControlOptions: { mapTypeIds: [maps.MapTypeId.SATELLITE, maps.MapTypeId.HYBRID] },
        streetViewControl: false,
        zoomControl: true,
        clickableIcons: false,
        gestureHandling: "greedy",
      });
      mapsApiRef.current = maps;
      DeviceMarkerRef.current = createDeviceMarkerClass(maps);
      mapRef.current = map;
      mapClickListener = map.addListener("click", (event) => {
        if (mappingModeRef.current !== "drawing" || !event.latLng || !draftLineRef.current) return;
        const path = draftLineRef.current.getPath();
        path.push(event.latLng);
        setDraftPoints(path.getArray().map((point) => point.toJSON()));
      });
      setMapStatus("ready");
    }).catch(() => {
      if (!disposed) setMapStatus("error");
    });

    return () => {
      disposed = true;
      mapClickListener?.remove();
      boundaryPolygonRef.current?.setMap(null);
      deviceMarkerRefs.current.forEach((marker) => marker.setMap(null));
      deviceMarkerRefs.current = [];
      draftLineRef.current?.setMap(null);
      draftPolygonRef.current?.setMap(null);
      draftPathListenersRef.current.forEach((listener) => listener.remove());
      draftPathListenersRef.current = [];
      mapRef.current = null;
      mapsApiRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapStatus !== "ready" || !mapRef.current || !mapsApiRef.current) return;
    boundaryPolygonRef.current?.setMap(null);
    boundaryPolygonRef.current = new mapsApiRef.current.Polygon({
      paths: boundary,
      map: mapRef.current,
      strokeColor: "#55e27b",
      strokeOpacity: 1,
      strokeWeight: 4,
      fillColor: "#39a95c",
      fillOpacity: 0.14,
      clickable: false,
      visible: mappingModeRef.current === "idle",
      zIndex: 2,
    });
    if (!hasFittedMapRef.current) {
      const bounds = new mapsApiRef.current.LatLngBounds();
      boundary.forEach((point) => bounds.extend(point));
      mapRef.current.fitBounds(bounds, 55);
      hasFittedMapRef.current = true;
    }
  }, [boundary, mapStatus]);

  useEffect(() => {
    if (mapStatus !== "ready" || !mapRef.current || !DeviceMarkerRef.current) return;
    deviceMarkerRefs.current.forEach((marker) => marker.setMap(null));
    const DeviceMarker = DeviceMarkerRef.current;
    deviceMarkerRefs.current = farmMapData.devices.map((device) => {
      const marker = new DeviceMarker(device, device.id === selectedDeviceId, () => {
        if (mappingModeRef.current === "idle") setSelectedDeviceId(device.id);
      });
      marker.setMap(mapRef.current);
      return marker;
    });
  }, [mapStatus, selectedDeviceId]);

  useEffect(() => {
    if (mappingMode === "idle" && mapStatus === "ready" && mapRef.current) mapRef.current.panTo(selectedDevice.coordinates);
  }, [mapStatus, mappingMode, selectedDevice.coordinates]);

  const clearDraftOverlays = () => {
    draftPathListenersRef.current.forEach((listener) => listener.remove());
    draftPathListenersRef.current = [];
    draftLineRef.current?.setMap(null);
    draftPolygonRef.current?.setMap(null);
    draftLineRef.current = null;
    draftPolygonRef.current = null;
  };

  const startBoundaryMapping = () => {
    if (!mapRef.current || !mapsApiRef.current || mapStatus !== "ready") return;
    clearDraftOverlays();
    draftLineRef.current = new mapsApiRef.current.Polyline({
      path: [],
      map: mapRef.current,
      strokeColor: "#66f08a",
      strokeOpacity: 1,
      strokeWeight: 4,
      clickable: false,
      zIndex: 20,
    });
    setDraftPoints([]);
    mappingModeRef.current = "drawing";
    setMappingMode("drawing");
  };

  const undoDraftPoint = () => {
    const path = draftLineRef.current?.getPath();
    if (!path?.getLength()) return;
    path.pop();
    setDraftPoints(path.getArray().map((point) => point.toJSON()));
  };

  const finishBoundary = () => {
    if (!mapsApiRef.current || !mapRef.current || draftPoints.length < 3) return;
    const path = draftLineRef.current.getPath().getArray().map((point) => point.toJSON());
    draftLineRef.current.setMap(null);
    draftLineRef.current = null;
    const polygon = new mapsApiRef.current.Polygon({
      paths: path,
      map: mapRef.current,
      strokeColor: "#66f08a",
      strokeOpacity: 1,
      strokeWeight: 4,
      fillColor: "#39a95c",
      fillOpacity: 0.2,
      editable: true,
      zIndex: 25,
    });
    const syncEditedPath = () => setDraftPoints(polygon.getPath().getArray().map((point) => point.toJSON()));
    draftPathListenersRef.current = [polygon.getPath().addListener("set_at", syncEditedPath), polygon.getPath().addListener("insert_at", syncEditedPath), polygon.getPath().addListener("remove_at", syncEditedPath)];
    draftPolygonRef.current = polygon;
    setDraftPoints(path);
    mappingModeRef.current = "review";
    setMappingMode("review");
  };

  const cancelBoundaryMapping = () => {
    clearDraftOverlays();
    setDraftPoints([]);
    mappingModeRef.current = "idle";
    setMappingMode("idle");
  };

  const saveBoundary = () => {
    const path = draftPolygonRef.current?.getPath().getArray().map((point) => point.toJSON()) || draftPoints;
    if (path.length < 3) return;
    setBoundary(path);
    saveFarmBoundary(window.localStorage, path);
    clearDraftOverlays();
    setDraftPoints([]);
    mappingModeRef.current = "idle";
    setMappingMode("idle");
    mapRef.current?.panTo(getPathCenter(path));
  };

  const formatMetric = (metric) => metric.type === "state" ? (metric.value ? t("farmMap.running") : t("farmMap.stopped")) : `${metric.value}${metric.suffix || ""}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${farmCenter.lat},${farmCenter.lng}`;

  return (
    <div className="page-stack farm-map-page">
      <PageHeader
        kicker={t("farmMap.kicker")}
        title={t("farmMap.title")}
        description={t("farmMap.deviceMapDescription")}
        actions={<><button className="button primary" type="button" onClick={startBoundaryMapping} disabled={mapStatus !== "ready" || mappingMode !== "idle"}><Icon name="Spline" size={16} />{t("farmMap.mapBoundary")}</button><a className="button secondary" href={googleMapsUrl} target="_blank" rel="noreferrer"><MapPinned size={16} />{t("farmMap.openGoogle")}<ExternalLink size={14} /></a></>}
      />

      <section className="farm-map-shell card">
        <div className={`farm-map-canvas ${mappingMode !== "idle" ? "mapping-active" : ""}`}>
          <div ref={mapNodeRef} className="google-farm-map" aria-label={t("farmMap.satelliteAlt")} />
          {mapStatus === "loading" && <div className="map-load-state"><i />{t("farmMap.loadingMap")}</div>}
          {mapStatus === "missing-key" && <div className="map-key-state"><MapPinned size={30} /><h2>{t("farmMap.keyNeeded")}</h2><p>{t("farmMap.keyHelp")}</p><code>VITE_GOOGLE_MAPS_API_KEY</code><a href="https://developers.google.com/maps/documentation/javascript/get-api-key" target="_blank" rel="noreferrer">{t("farmMap.keyGuide")} <ExternalLink size={13} /></a></div>}
          {mapStatus === "error" && <div className="map-key-state error"><Icon name="TriangleAlert" size={30} /><h2>{t("farmMap.mapError")}</h2><p>{t("farmMap.mapErrorHelp")}</p></div>}
          <div className="farm-map-location-chip"><Satellite size={16} /><span><strong>{farmMapData.farm.name}</strong><small>{farmMapData.farm.location}</small></span></div>
          <div className="farm-map-status"><i className={connection === "live" ? "live" : ""} />{connection === "live" ? t("common.live") : t("common.demo")}</div>
          {mappingMode !== "idle" && <div className="map-drawing-banner"><Icon name={mappingMode === "drawing" ? "Crosshair" : "PencilRuler"} size={16} /><span><strong>{mappingMode === "drawing" ? t("farmMap.mappingBoundary") : t("farmMap.adjustBoundary")}</strong><small>{mappingMode === "drawing" ? t("farmMap.clickCorners") : t("farmMap.dragVertices")}</small></span></div>}
          <div className="farm-map-legend"><span><i className="boundary-swatch" />{t("farmMap.farmBoundary")}<b>·</b><i className="device-swatch" />{farmMapData.devices.length} {t("farmMap.devices")}</span><small>{mappingMode === "idle" ? t("farmMap.deviceTapHint") : `${draftPoints.length} ${t("farmMap.boundaryPoints")}`}</small></div>
        </div>

        {mappingMode !== "idle" ? (
          <aside className="farm-zone-panel mapping-panel">
            <header className="mapping-panel-head"><div className="zone-heading-icon map-draft-icon"><Icon name={mappingMode === "drawing" ? "Spline" : "PencilRuler"} size={20} /></div><div><span>{t("farmMap.boundaryMapper")}</span><h2>{mappingMode === "drawing" ? t("farmMap.drawFarmBoundary") : t("farmMap.reviewBoundary")}</h2><p>{t("farmMap.savedOnDevice")}</p></div></header>
            <div className="mapping-panel-body">
              <div className="mapping-steps"><div className={draftPoints.length > 0 ? "done" : "active"}><b>1</b><span><strong>{t("farmMap.placeCorners")}</strong><small>{t("farmMap.placeBoundaryHelp")}</small></span></div><div className={draftPoints.length >= 3 ? "active" : ""}><b>2</b><span><strong>{t("farmMap.finishBoundary")}</strong><small>{t("farmMap.finishBoundaryHelp")}</small></span></div><div className={mappingMode === "review" ? "active" : ""}><b>3</b><span><strong>{t("farmMap.reviewAndSave")}</strong><small>{t("farmMap.reviewAndSaveHelp")}</small></span></div></div>
              <div className="boundary-counter"><Icon name="Route" size={18} /><span><strong>{draftPoints.length}</strong><small>{t("farmMap.boundaryPoints")}</small></span><b>{draftPoints.length >= 3 ? `${draftArea} ${t("farmMap.acres")}` : t("farmMap.minimumPoints")}</b></div>
              {mappingMode === "review" && <div className="edit-boundary-note"><Icon name="Move3D" size={16} /><span><strong>{t("farmMap.adjustBeforeSave")}</strong><small>{t("farmMap.adjustBoundaryHelp")}</small></span></div>}
              <div className="mapping-actions">{mappingMode === "drawing" ? <><button className="button secondary" type="button" onClick={undoDraftPoint} disabled={!draftPoints.length}><Icon name="Undo2" size={15} />{t("farmMap.undoPoint")}</button><button className="button primary" type="button" onClick={finishBoundary} disabled={draftPoints.length < 3}><Icon name="Check" size={15} />{t("farmMap.finish")}</button></> : <button className="button primary" type="button" onClick={saveBoundary}><Icon name="Save" size={15} />{t("farmMap.saveBoundary")}</button>}<button className="button ghost" type="button" onClick={cancelBoundaryMapping}><Icon name="X" size={15} />{t("common.cancel")}</button></div>
            </div>
          </aside>
        ) : (
          <aside className="farm-zone-panel device-detail-panel">
            <header className="farm-device-panel-head"><div className="device-heading-icon" style={{ "--device-color": selectedDevice.color }}><span>{selectedDevice.marker}</span></div><div><span>{t(selectedDevice.typeKey)}</span><h2>{selectedDevice.name}</h2><p>{selectedDevice.id}</p></div><span className={`status-badge ${selectedDevice.status === "online" ? "success" : "warning"}`}><i />{t(`common.${selectedDevice.status === "online" ? "online" : "warning"}`)}</span></header>
            <div className="farm-device-list" aria-label={t("farmMap.chooseDevice")}>{farmMapData.devices.map((device) => <button key={device.id} type="button" className={device.id === selectedDevice.id ? "active" : ""} style={{ "--device-color": device.color }} onClick={() => setSelectedDeviceId(device.id)}><b>{device.marker}</b><span><strong>{device.name}</strong><small>{device.id}</small></span><i className={device.status} /></button>)}</div>
            <div className="farm-zone-metrics device-metrics">{displayedMetrics.map((metric) => <div key={metric.id}><span className={`zone-metric-icon ${metric.tone}`}><Icon name={metric.icon} size={18} /></span><small>{t(metric.labelKey)}</small><strong>{formatMetric(metric)}</strong></div>)}</div>
            <div className="device-coordinate-card"><Icon name="MapPin" size={17} /><span><small>{t("farmMap.deviceCoordinates")}</small><strong>{selectedDevice.coordinates.lat.toFixed(6)}, {selectedDevice.coordinates.lng.toFixed(6)}</strong></span></div>
            <div className={`zone-advisory ${selectedDevice.status === "warning" ? "warning" : "healthy"}`}><Icon name={selectedDevice.status === "warning" ? "TriangleAlert" : "CircleCheckBig"} size={18} /><div><strong>{t("farmMap.deviceStatus")}</strong><span>{t(selectedDevice.noteKey)}</span></div></div>
            {selectedDevice.id.startsWith("PUMP") && <section className="zone-motor-card device-motor-link"><header><span><Icon name="Tractor" size={17} />{t("farmMap.motorControl")}</span><b className="online"><i />{t("common.online")}</b></header><Link className="button ghost small" to="/irrigation"><Icon name="SlidersHorizontal" size={14} />{t("farmMap.openControls")}</Link></section>}
            <div className="zone-device-strip"><span><Icon name="BatteryMedium" size={15} />{selectedDevice.battery}%</span><span><Icon name="Wifi" size={15} />{selectedDevice.signal}%</span><span><Icon name="Clock3" size={15} />{selectedDevice.lastSeen}</span></div>
            <footer className="farm-zone-panel-foot"><span><Icon name="Spline" size={13} />{boundary.length} {t("farmMap.boundaryPoints")}</span><strong>{boundaryArea} {t("farmMap.acres")}</strong></footer>
          </aside>
        )}
      </section>
    </div>
  );
}
