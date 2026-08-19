import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Satellite } from "lucide-react";
import Icon from "../components/Icon";
import farmMapData from "../data/farmMap.json";
import { useLanguage } from "../context/LanguageContext";
import { useFarm } from "../context/FarmContext";
import { useSensorData } from "../hooks/useSensorData";
import { calculatePolygonAreaAcres } from "../utils/farmMapping";
import { GOOGLE_MAPS_API_KEY, loadGoogleMaps } from "../utils/googleMaps";
import { createDeviceMarkerClass } from "../utils/googleMapOverlays";

const apiKey = GOOGLE_MAPS_API_KEY;
const farmCenter = farmMapData.farm.coordinates;

export default function FarmMap() {
  const { t } = useLanguage();
  const { data, connection } = useSensorData();
  const { farmBoundary: boundary, farmDevices: devices } = useFarm();
  const [selectedDeviceId, setSelectedDeviceId] = useState(() => devices[0]?.id || null);
  const [deviceSlide, setDeviceSlide] = useState(0);
  const [mapStatus, setMapStatus] = useState(apiKey ? "loading" : "missing-key");
  const mapNodeRef = useRef(null);
  const mapRef = useRef(null);
  const mapsApiRef = useRef(null);
  const DeviceMarkerRef = useRef(null);
  const boundaryPolygonRef = useRef(null);
  const deviceMarkerRefs = useRef([]);
  const hasFittedMapRef = useRef(false);
  const slideTouchStartRef = useRef(null);

  const selectedDevice = devices.find((device) => device.id === selectedDeviceId) || devices[0] || null;
  const devicePages = useMemo(() => Array.from({ length: Math.ceil(devices.length / 2) }, (_, index) => devices.slice(index * 2, index * 2 + 2)), [devices]);
  const boundaryArea = useMemo(() => calculatePolygonAreaAcres(boundary), [boundary]);
  const displayedMetrics = useMemo(() => {
    if (!selectedDevice) return [];
    return selectedDevice.metrics.map((metric) => {
      let value = metric.value;
      if (selectedDevice.id === "FIELD-001" && metric.id !== "soilTemperature" && data[metric.id] !== undefined) value = data[metric.id];
      if (selectedDevice.id === "PUMP-A01" && metric.id === "pumpState") value = Boolean(data.pumpState);
      if (selectedDevice.id === "TANK-001" && metric.id === "waterTankLevel" && data.waterTankLevel !== undefined) value = data.waterTankLevel;
      return { ...metric, value };
    });
  }, [data, selectedDevice]);

  useEffect(() => {
    if (!apiKey || !mapNodeRef.current) return undefined;
    let disposed = false;
    loadGoogleMaps(apiKey).then((maps) => {
      if (disposed || !mapNodeRef.current) return;
      mapRef.current = new maps.Map(mapNodeRef.current, {
        center: farmCenter,
        zoom: 18,
        mapTypeId: maps.MapTypeId.SATELLITE,
        tilt: 0,
        heading: 0,
        fullscreenControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        zoomControl: true,
        clickableIcons: false,
        gestureHandling: "greedy",
      });
      mapsApiRef.current = maps;
      DeviceMarkerRef.current = createDeviceMarkerClass(maps);
      setMapStatus("ready");
    }).catch(() => {
      if (!disposed) setMapStatus("error");
    });

    return () => {
      disposed = true;
      boundaryPolygonRef.current?.setMap(null);
      deviceMarkerRefs.current.forEach((marker) => marker.setMap(null));
      deviceMarkerRefs.current = [];
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
      zIndex: 2,
    });
    if (!hasFittedMapRef.current) {
      const bounds = new mapsApiRef.current.LatLngBounds();
      boundary.forEach((point) => bounds.extend(point));
      mapRef.current.fitBounds(bounds, 44);
      hasFittedMapRef.current = true;
    }
  }, [boundary, mapStatus]);

  useEffect(() => {
    if (mapStatus !== "ready" || !mapRef.current || !DeviceMarkerRef.current) return;
    deviceMarkerRefs.current.forEach((marker) => marker.setMap(null));
    const DeviceMarker = DeviceMarkerRef.current;
    deviceMarkerRefs.current = devices.map((device) => {
      const marker = new DeviceMarker(device, device.id === selectedDeviceId, () => setSelectedDeviceId(device.id));
      marker.setMap(mapRef.current);
      return marker;
    });
  }, [devices, mapStatus, selectedDeviceId]);

  useEffect(() => {
    if (mapStatus === "ready" && mapRef.current && selectedDevice) mapRef.current.panTo(selectedDevice.coordinates);
  }, [mapStatus, selectedDevice]);

  useEffect(() => {
    const selectedIndex = devices.findIndex((device) => device.id === selectedDeviceId);
    if (selectedIndex >= 0) setDeviceSlide(Math.floor(selectedIndex / 2));
  }, [devices, selectedDeviceId]);

  const formatMetric = (metric) => metric.type === "state" ? (metric.value ? t("farmMap.running") : t("farmMap.stopped")) : `${metric.value}${metric.suffix || ""}`;
  const isMotorDevice = selectedDevice?.typeKey === "farmMap.deviceTypes.motor" || selectedDevice?.typeKey === "farmMap.deviceTypes.motorControlUnit";

  return (
    <div className="page-stack farm-map-page">
      <section className="farm-map-shell compact-map card">
        <div className="farm-map-canvas">
          <div ref={mapNodeRef} className="google-farm-map" aria-label={t("farmMap.satelliteAlt")} />
          {mapStatus === "loading" && <div className="map-load-state"><i />{t("farmMap.loadingMap")}</div>}
          {mapStatus === "missing-key" && <div className="map-key-state"><Icon name="MapPinned" size={30} /><h2>{t("farmMap.keyNeeded")}</h2><p>{t("farmMap.keyHelp")}</p><code>VITE_GOOGLE_MAPS_API_KEY</code></div>}
          {mapStatus === "error" && <div className="map-key-state error"><Icon name="TriangleAlert" size={30} /><h2>{t("farmMap.mapError")}</h2><p>{t("farmMap.mapErrorHelp")}</p></div>}
          <div className="farm-map-location-chip"><Satellite size={16} /><span><strong>{farmMapData.farm.name}</strong><small>{farmMapData.farm.location} · {t("farmMap.savedMapping")}</small></span></div>
          <div className="farm-map-status"><i className={connection === "live" ? "live" : ""} />{connection === "live" ? t("common.live") : t("common.demo")}</div>
          <div className="farm-map-legend"><span><i className="boundary-swatch" />{t("farmMap.farmBoundary")}<b>·</b><i className="device-swatch" />{devices.length} {t("farmMap.devices")}</span><small>{t("farmMap.deviceTapHint")}</small></div>
        </div>

        {selectedDevice ? <aside className={`farm-zone-panel device-detail-panel ${isMotorDevice ? "motor-device-panel" : ""}`}>
          <header className="farm-device-panel-head"><div className="device-heading-icon" style={{ "--device-color": selectedDevice.color }}><span>{selectedDevice.marker}</span></div><div><span>{t(selectedDevice.typeKey)}</span><h2>{selectedDevice.name}</h2><p>{selectedDevice.id}</p></div><span className={`status-badge ${selectedDevice.status === "online" ? "success" : "warning"}`}><i />{t(`common.${selectedDevice.status === "online" ? "online" : "warning"}`)}</span></header>
          <div className="farm-device-slider" aria-label={t("farmMap.chooseDevice")}>
            <button className="device-slide-arrow" type="button" disabled={deviceSlide === 0} onClick={() => setDeviceSlide((page) => Math.max(0, page - 1))} aria-label={t("farmMap.previousDevices")}><Icon name="ChevronLeft" size={16} /></button>
            <div className="farm-device-slider-viewport" onTouchStart={(event) => { slideTouchStartRef.current = event.touches[0].clientX; }} onTouchEnd={(event) => { const start = slideTouchStartRef.current; if (start === null) return; const distance = event.changedTouches[0].clientX - start; if (Math.abs(distance) > 40) setDeviceSlide((page) => distance < 0 ? Math.min(devicePages.length - 1, page + 1) : Math.max(0, page - 1)); slideTouchStartRef.current = null; }}>
              <div className="farm-device-slider-track" style={{ transform: `translateX(-${deviceSlide * 100}%)` }}>{devicePages.map((page, pageIndex) => <div className="farm-device-slide" key={page.map((device) => device.id).join("-") || pageIndex}>{page.map((device) => <button key={device.id} type="button" className={device.id === selectedDevice.id ? "active" : ""} style={{ "--device-color": device.color }} onClick={() => setSelectedDeviceId(device.id)}><b>{device.marker}</b><span><strong>{device.name}</strong><small>{device.id}</small></span><i className={device.status} /></button>)}</div>)}</div>
            </div>
            <button className="device-slide-arrow" type="button" disabled={deviceSlide >= devicePages.length - 1} onClick={() => setDeviceSlide((page) => Math.min(devicePages.length - 1, page + 1))} aria-label={t("farmMap.nextDevices")}><Icon name="ChevronRight" size={16} /></button>
            <div className="device-slide-dots" aria-hidden="true">{devicePages.map((page, index) => <i className={index === deviceSlide ? "active" : ""} key={page[0]?.id || index} />)}</div>
          </div>
          <div className="farm-zone-metrics device-metrics">{displayedMetrics.map((metric) => <div key={metric.id}><span className={`zone-metric-icon ${metric.tone}`}><Icon name={metric.icon} size={18} /></span><small>{t(metric.labelKey)}</small><strong>{formatMetric(metric)}</strong></div>)}</div>
          <div className="device-coordinate-card"><Icon name="MapPin" size={17} /><span><small>{t("farmMap.deviceCoordinates")}</small><strong>{selectedDevice.coordinates.lat.toFixed(6)}, {selectedDevice.coordinates.lng.toFixed(6)}</strong></span></div>
          <div className={`zone-advisory ${selectedDevice.status === "warning" ? "warning" : "healthy"}`}><Icon name={selectedDevice.status === "warning" ? "TriangleAlert" : "CircleCheckBig"} size={18} /><div><strong>{t("farmMap.deviceStatus")}</strong><span>{t(selectedDevice.noteKey)}</span></div></div>
          {isMotorDevice && <section className="zone-motor-card device-motor-link"><header><span><Icon name="Tractor" size={17} />{t("farmMap.motorControl")}</span><b className="online"><i />{t("common.online")}</b></header><Link className="button ghost small" to="/irrigation"><Icon name="SlidersHorizontal" size={14} />{t("farmMap.openControls")}</Link></section>}
          <div className="zone-device-strip"><span><Icon name="BatteryMedium" size={15} />{selectedDevice.battery}%</span><span><Icon name="Wifi" size={15} />{selectedDevice.signal}%</span><span><Icon name="Clock3" size={15} />{selectedDevice.lastSeen}</span></div>
          <footer className="farm-zone-panel-foot"><span><Icon name="Spline" size={13} />{boundary.length} {t("farmMap.boundaryPoints")}</span><strong>{boundaryArea} {t("farmMap.acres")}</strong></footer>
        </aside> : <aside className="farm-zone-panel empty-device-panel"><Icon name="RadioTower" size={34} /><h2>{t("farmMap.noDevices")}</h2><p>{t("farmMap.noDevicesHelp")}</p><Link className="button primary" to="/settings"><Icon name="Settings" size={15} />{t("farmMap.mapperTitle")}</Link></aside>}
      </section>
    </div>
  );
}
