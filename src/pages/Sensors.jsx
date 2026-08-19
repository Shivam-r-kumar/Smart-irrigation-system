import { BatteryCharging, MapPin, RadioTower, Signal, WifiOff } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useFarm } from "../context/FarmContext";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

export default function Sensors() {
  const { t } = useLanguage();
  const { farmDevices } = useFarm();
  const [filter, setFilter] = useState("all");
  const devices = filter === "all" ? farmDevices : farmDevices.filter((device) => device.status === filter);
  const counts = farmDevices.reduce((result, device) => ({ ...result, [device.status]: (result[device.status] || 0) + 1 }), {});
  const filters = [
    { value: "all", label: t("sensors.allDevices"), count: farmDevices.length },
    { value: "online", label: t("sensors.onlineDevices"), count: counts.online || 0 },
    { value: "warning", label: t("sensors.warningDevices"), count: counts.warning || 0 },
    { value: "offline", label: t("sensors.offlineDevices"), count: counts.offline || 0 },
  ];

  return (
    <div className="page-stack">
      <PageHeader kicker="CONNECTED FARM DEVICE FLEET" title={t("sensors.title")} description={t("sensors.connectedMapDescription")} actions={<Link className="button primary" to="/settings"><RadioTower size={17} />{t("sensors.manageDevices")}</Link>} />
      <div className="filter-tabs">{filters.map((item) => <button type="button" className={filter === item.value ? "active" : ""} key={item.value} onClick={() => setFilter(item.value)}>{item.label}<b>{item.count}</b></button>)}</div>
      {devices.length ? <div className="device-grid">{devices.map((device) => {
        const installedSensors = device.metrics?.map((metric) => t(metric.labelKey)) || [];
        return <article className={`card device-card ${device.status}`} key={device.id} style={{ "--device-color": device.color }}><header><div className="device-symbol">{device.status === "offline" ? <WifiOff /> : <RadioTower />}</div><div><h2>{device.name}</h2><strong className="device-registry-id">{device.id}</strong><span><MapPin size={13} />{device.coordinates.lat.toFixed(6)}, {device.coordinates.lng.toFixed(6)}</span></div><StatusBadge tone={device.status === "online" ? "success" : device.status} dot>{t(`common.${device.status}`)}</StatusBadge></header><div className="device-metrics"><div><BatteryCharging size={17} /><span>{t("common.battery")}</span><strong>{device.battery}%</strong></div><div><Signal size={17} /><span>{t("common.signal")}</span><strong>{device.signal}%</strong></div></div><div className="device-bars"><span><i style={{ width: `${device.battery}%` }} /></span><span><i style={{ width: `${device.signal}%` }} /></span></div><div className="installed-sensors"><span>{t("sensors.installed")}</span><div>{installedSensors.map((sensor, index) => <b key={`${device.id}-${index}`}>{sensor}</b>)}</div></div><footer><span>{t(device.typeKey)}</span><strong>{device.lastSeen}</strong></footer></article>;
      })}</div> : <div className="card empty-state"><RadioTower size={30} /><p>{t("sensors.noMappedDevices")}</p><Link className="button primary small" to="/settings">{t("sensors.manageDevices")}</Link></div>}
    </div>
  );
}
