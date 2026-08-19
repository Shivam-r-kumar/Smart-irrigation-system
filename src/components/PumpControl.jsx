import { Play, Power, Square, TimerReset } from "lucide-react";
import { useState } from "react";
import { useFarm } from "../context/FarmContext";
import { useLanguage } from "../context/LanguageContext";
import ConfirmationModal from "./ConfirmationModal";

export default function PumpControl({ compact = false, showRecommendation = true }) {
  const { sensorData, controlLoading, controlPump, toggleAutoMode } = useFarm();
  const { t } = useLanguage();
  const [pendingState, setPendingState] = useState(null);

  const confirmAction = async () => {
    await controlPump(pendingState);
    setPendingState(null);
  };

  return (
    <section className={`card pump-card ${compact ? "compact" : ""}`}>
      <header className="card-header pump-header"><h2><Power size={19} />{t("irrigation.panelTitle")}</h2><span className="mode-pill">{t("irrigation.autoMode")}</span></header>
      <div className="auto-row">
        <div><span>{t("irrigation.automatic")}</span><strong>{sensorData.autoMode ? t("irrigation.enabled") : t("irrigation.disabled")}</strong></div>
        <button className={`toggle ${sensorData.autoMode ? "on" : ""}`} onClick={toggleAutoMode} disabled={controlLoading} aria-label={t("irrigation.autoMode")}><i /></button>
      </div>
      <span className="field-label">{t("irrigation.manualControl")}</span>
      <div className="pump-actions">
        <button className="button primary" onClick={() => setPendingState(true)} disabled={controlLoading || sensorData.pumpState}><Play size={16} />{t("irrigation.startPump")}</button>
        <button className="button danger" onClick={() => setPendingState(false)} disabled={controlLoading || !sensorData.pumpState}><Square size={15} />{t("irrigation.stopPump")}</button>
      </div>
      {showRecommendation && <div className="recommendation-strip"><TimerReset size={20} /><div><span>{t("irrigation.nextRecommendation")}</span><strong>{t("irrigation.recommendedIn")}</strong></div></div>}
      <div className="usage-pair"><div><span>{t("irrigation.waterToday")}</span><strong>126 L</strong></div><div><span>{t("irrigation.waterSaved")}</span><strong>1,540 L</strong></div></div>
      <div className="weather-warning">⚠ <span>{t("irrigation.rainWarning")}</span></div>
      <ConfirmationModal open={pendingState !== null} title={pendingState ? t("irrigation.startPump") : t("irrigation.stopPump")} message={pendingState ? t("irrigation.confirmStart") : t("irrigation.confirmStop")} confirmLabel={t("common.confirm")} cancelLabel={t("common.cancel")} tone={pendingState ? "green" : "red"} loading={controlLoading} onConfirm={confirmAction} onClose={() => setPendingState(null)} />
    </section>
  );
}
