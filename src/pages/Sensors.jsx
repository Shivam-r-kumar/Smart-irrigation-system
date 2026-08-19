import { BatteryCharging, MapPin, RadioTower, Signal, WifiOff } from "lucide-react";
import { useState } from "react";
import sensorData from "../data/sensors.json";
import { useLanguage } from "../context/LanguageContext";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

export default function Sensors() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState("all");
  const devices = filter === "all" ? sensorData.devices : sensorData.devices.filter((device) => device.status === filter);
  const counts = sensorData.devices.reduce((result, device) => ({ ...result, [device.status]: (result[device.status] || 0) + 1 }), {});
  const filters = [{ value:"all", label:t("sensors.allDevices"), count:sensorData.devices.length }, { value:"online", label:t("sensors.onlineDevices"), count:counts.online }, { value:"warning", label:t("sensors.warningDevices"), count:counts.warning }, { value:"offline", label:t("sensors.offlineDevices"), count:counts.offline }];
  return (
    <div className="page-stack">
      <PageHeader kicker="ESP32 DEVICE FLEET" title={t(sensorData.headingKey)} description={t(sensorData.descriptionKey)} actions={<button className="button primary"><RadioTower size={17}/>Add Device</button>} />
      <div className="filter-tabs">{filters.map((item) => <button className={filter === item.value ? "active" : ""} key={item.value} onClick={() => setFilter(item.value)}>{item.label}<b>{item.count}</b></button>)}</div>
      <div className="device-grid">{devices.map((device) => <article className={`card device-card ${device.status}`} key={device.id}><header><div className="device-symbol">{device.status === "offline" ? <WifiOff/> : <RadioTower/>}</div><div><h2>{device.id}</h2><span><MapPin size={13}/>{device.zone}</span></div><StatusBadge tone={device.status === "online" ? "success" : device.status} dot>{device.status}</StatusBadge></header><div className="device-metrics"><div><BatteryCharging size={17}/><span>{t("common.battery")}</span><strong>{device.battery}%</strong></div><div><Signal size={17}/><span>{t("common.signal")}</span><strong>{device.signal}%</strong></div></div><div className="device-bars"><span><i style={{ width:`${device.battery}%` }}/></span><span><i style={{ width:`${device.signal}%` }}/></span></div><div className="installed-sensors"><span>{t("sensors.installed")}</span><div>{device.sensors.map((sensor) => <b key={sensor}>{sensor}</b>)}</div></div><footer><span>{t("common.lastUpdated")}</span><strong>{device.lastSeen}</strong></footer></article>)}</div>
    </div>
  );
}
