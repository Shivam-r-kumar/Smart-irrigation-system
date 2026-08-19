import { Check, CloudCog, MapPinned, Moon, Save, Sun, UserRound } from "lucide-react";
import { useState } from "react";
import settings from "../data/settings.json";
import { useLanguage } from "../context/LanguageContext";
import { useFarm } from "../context/FarmContext";
import { useTheme } from "../context/ThemeContext";
import FarmMapperModal from "../components/FarmMapperModal";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

export default function Settings() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { farmBoundary, farmDevices, updateFarmMapping } = useFarm();
  const [form, setForm] = useState({ profileName:settings.profile.name, email:settings.profile.email, phone:settings.profile.phone, farmName:settings.farm.name, location:settings.farm.location, area:settings.farm.area, soilType:settings.farm.soilType, currentCrop:settings.farm.currentCrop, ...settings.thresholds, temperatureUnit:"Celsius" });
  const [saved, setSaved] = useState(false);
  const [mapperOpen, setMapperOpen] = useState(false);
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]:event.target.value }));
  const submit = (event) => { event.preventDefault(); setSaved(true); window.setTimeout(() => setSaved(false), 2500); };
  return (
    <div className="page-stack settings-page">
      <PageHeader kicker="ACCOUNT & AUTOMATION" title={t(settings.headingKey)} description={t(settings.descriptionKey)} />
      {saved && <div className="toast-success"><Check size={17}/>{t("settings.saved")}</div>}
      <form className="settings-grid" onSubmit={submit}>
        <section className="card settings-section"><header className="card-header"><h2><UserRound size={19}/>{t("settings.profile")}</h2></header><div className="form-grid"><label className="form-field"><span>{t("settings.farmerName")}</span><input name="profileName" value={form.profileName} onChange={update}/></label><label className="form-field"><span>{t("settings.email")}</span><input name="email" type="email" value={form.email} onChange={update}/></label><label className="form-field"><span>{t("settings.phone")}</span><input name="phone" value={form.phone} onChange={update}/></label></div></section>
        <section className="card settings-section"><header className="card-header"><h2>🌾 {t("settings.farm")}</h2></header><div className="form-grid"><label className="form-field"><span>{t("settings.farmName")}</span><input name="farmName" value={form.farmName} onChange={update}/></label><label className="form-field"><span>{t("settings.location")}</span><input name="location" value={form.location} onChange={update}/></label><label className="form-field"><span>{t("settings.area")}</span><input name="area" value={form.area} onChange={update}/></label><label className="form-field"><span>{t("settings.currentCrop")}</span><input name="currentCrop" value={form.currentCrop} onChange={update}/></label></div><div className="settings-map-row"><span><MapPinned size={20}/><span><strong>{t("farmMap.mapperTitle")}</strong><small>{farmBoundary.length} {t("farmMap.boundaryPoints")} · {farmDevices.length} {t("farmMap.devices")}</small></span></span><button className="button primary small" type="button" onClick={() => setMapperOpen(true)}><MapPinned size={15}/>{t("farmMap.map")}</button></div></section>
        <section className="card settings-section device-settings"><header className="card-header"><h2><CloudCog size={19}/>{t("settings.device")}</h2><StatusBadge tone="success" dot>{t("common.online")}</StatusBadge></header><div><span>{t("settings.deviceId")}</span><strong>{settings.device.id}</strong></div><div><span>{t("settings.connection")}</span><strong>{settings.device.firebase}</strong></div></section>
        <section className="card settings-section preferences"><header className="card-header"><h2>◐ {t("settings.preferences")}</h2></header><div className="preference-row"><span>{t("settings.language")}</span><div className="segmented"><button type="button" className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>English</button><button type="button" className={language === "hi" ? "active" : ""} onClick={() => setLanguage("hi")}>हिन्दी</button></div></div><div className="preference-row"><span>{t("settings.theme")}</span><div className="segmented"><button type="button" className={theme === "light" ? "active" : ""} onClick={() => setTheme("light")}><Sun size={15}/>{t("settings.light")}</button><button type="button" className={theme === "dark" ? "active" : ""} onClick={() => setTheme("dark")}><Moon size={15}/>{t("settings.dark")}</button></div></div><label className="preference-row"><span>{t("settings.temperatureUnit")}</span><select name="temperatureUnit" value={form.temperatureUnit} onChange={update}>{settings.temperatureUnits.map((unit) => <option key={unit}>{unit}</option>)}</select></label></section>
        <section className="card settings-section irrigation-settings"><header className="card-header"><h2>💧 {t("settings.irrigation")}</h2></header><div className="form-grid">{[{ name:"minimumMoisture", key:"settings.minMoisture", unit:"%" }, { name:"maximumMoisture", key:"settings.maxMoisture", unit:"%" }, { name:"maximumPumpDuration", key:"settings.maxDuration", unit:"min" }, { name:"lowTankThreshold", key:"settings.lowTank", unit:"%" }].map((field) => <label className="form-field" key={field.name}><span>{t(field.key)}</span><div className="input-unit"><input name={field.name} type="number" value={form[field.name]} onChange={update}/><small>{field.unit}</small></div></label>)}</div><button className="button primary save-settings" type="submit"><Save size={16}/>{t("common.save")}</button></section>
      </form>
      {mapperOpen && <FarmMapperModal boundary={farmBoundary} devices={farmDevices} onSave={(nextBoundary, nextDevices) => { updateFarmMapping(nextBoundary, nextDevices); setMapperOpen(false); }} onClose={() => setMapperOpen(false)} />}
    </div>
  );
}
