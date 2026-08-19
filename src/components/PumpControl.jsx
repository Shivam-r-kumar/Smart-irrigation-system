import { Gauge, MapPinned, Play, Power, Square, TimerReset, Tractor } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useFarm } from "../context/FarmContext";
import { useLanguage } from "../context/LanguageContext";
import ConfirmationModal from "./ConfirmationModal";
import StatusBadge from "./StatusBadge";

export default function PumpControl({ compact = false, showRecommendation = true }) {
  const {
    sensorData,
    controlLoading,
    motorLoadingIds,
    motorDevices,
    runningMotorCount,
    getMotorPumpState,
    controlMotor,
    controlAllMotors,
    toggleAutoMode,
  } = useFarm();
  const { t } = useLanguage();
  const [pendingAction, setPendingAction] = useState(null);

  const targetMotor = pendingAction?.deviceId
    ? motorDevices.find((device) => device.id === pendingAction.deviceId)
    : null;
  const allRunning = motorDevices.length > 0 && runningMotorCount === motorDevices.length;
  const noneRunning = runningMotorCount === 0;

  const confirmAction = async () => {
    if (!pendingAction) return;
    if (pendingAction.scope === "all") await controlAllMotors(pendingAction.state);
    else await controlMotor(pendingAction.deviceId, pendingAction.state);
    setPendingAction(null);
  };

  const confirmationTitle = pendingAction?.state ? t("irrigation.startPump") : t("irrigation.stopPump");
  const confirmationMessage = pendingAction?.scope === "all"
    ? (pendingAction.state ? t("irrigation.confirmStartAll") : t("irrigation.confirmStopAll"))
    : `${pendingAction?.state ? t("irrigation.confirmStartOne") : t("irrigation.confirmStopOne")} ${targetMotor?.name || ""} (${targetMotor?.id || ""})`;

  return (
    <section className={`card pump-card ${compact ? "compact" : "fleet"}`}>
      <header className="card-header pump-header">
        <h2><Power size={19} />{t("irrigation.panelTitle")}</h2>
        <span className="mode-pill">{motorDevices.length} {t("irrigation.motors")}</span>
      </header>
      <div className="auto-row">
        <div><span>{t("irrigation.automatic")}</span><strong>{sensorData.autoMode ? t("irrigation.enabled") : t("irrigation.disabled")}</strong></div>
        <button className={`toggle ${sensorData.autoMode ? "on" : ""}`} type="button" onClick={toggleAutoMode} disabled={controlLoading} aria-label={t("irrigation.autoMode")}><i /></button>
      </div>

      <div className="motor-fleet-summary">
        <span className="motor-fleet-icon"><Tractor size={18} /></span>
        <div><span>{t("irrigation.motorFleet")}</span><strong>{runningMotorCount} / {motorDevices.length} {t("irrigation.running")}</strong></div>
        <StatusBadge tone={runningMotorCount ? "success" : "neutral"} dot>{runningMotorCount ? t("irrigation.active") : t("irrigation.allStopped")}</StatusBadge>
      </div>

      <span className="field-label">{t("irrigation.allMotorControl")}</span>
      <div className="pump-actions all-motor-actions">
        <button className="button primary" type="button" onClick={() => setPendingAction({ scope: "all", state: true })} disabled={controlLoading || !motorDevices.length || allRunning}><Play size={16} />{t("irrigation.startAll")}</button>
        <button className="button danger" type="button" onClick={() => setPendingAction({ scope: "all", state: false })} disabled={controlLoading || !motorDevices.length || noneRunning}><Square size={15} />{t("irrigation.stopAll")}</button>
      </div>

      {!compact && (
        <div className="motor-control-section">
          <div className="motor-control-heading"><div><span className="eyebrow">{t("irrigation.motorControls")}</span><h3>{t("irrigation.individualControl")}</h3></div><b>{motorDevices.length}</b></div>
          {motorDevices.length ? (
            <div className="motor-control-list">
              {motorDevices.map((device, index) => {
                const running = getMotorPumpState(device);
                const loading = motorLoadingIds.includes(device.id);
                return (
                  <article className={`motor-control-row${running ? " running" : ""}`} key={device.id} style={{ "--motor-color": device.color }}>
                    <span className="motor-control-marker">{device.marker || `M${index + 1}`}</span>
                    <div className="motor-control-copy"><strong>{device.name}</strong><small>{device.id}</small></div>
                    <span className={`motor-live-state${running ? " running" : ""}`}><i />{running ? t("irrigation.pumpOn") : t("irrigation.pumpOff")}</span>
                    <div className="motor-row-actions">
                      <button className="button primary small" type="button" onClick={() => setPendingAction({ scope: "one", deviceId: device.id, state: true })} disabled={loading || running}><Play size={14} />{t("irrigation.start")}</button>
                      <button className="button danger small" type="button" onClick={() => setPendingAction({ scope: "one", deviceId: device.id, state: false })} disabled={loading || !running}><Square size={13} />{t("irrigation.stop")}</button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="motor-empty-state"><MapPinned size={23} /><div><strong>{t("irrigation.noMotors")}</strong><span>{t("irrigation.noMotorsHelp")}</span></div><Link className="button ghost small" to="/settings">{t("irrigation.addMotor")}</Link></div>
          )}
        </div>
      )}

      {compact && !motorDevices.length && <div className="motor-empty-compact"><MapPinned size={16} /><span>{t("irrigation.noMotors")}</span><Link to="/settings">{t("irrigation.addMotor")}</Link></div>}
      {showRecommendation && <div className="recommendation-strip"><TimerReset size={20} /><div><span>{t("irrigation.nextRecommendation")}</span><strong>{t("irrigation.recommendedIn")}</strong></div></div>}
      <div className="usage-pair"><div><span>{t("irrigation.waterToday")}</span><strong>126 L</strong></div><div><span>{t("irrigation.waterSaved")}</span><strong>1,540 L</strong></div></div>
      <div className="weather-warning"><Gauge size={14} /><span>{t("irrigation.rainWarning")}</span></div>
      <ConfirmationModal open={pendingAction !== null} title={confirmationTitle} message={confirmationMessage} confirmLabel={t("common.confirm")} cancelLabel={t("common.cancel")} tone={pendingAction?.state ? "green" : "red"} loading={controlLoading} onConfirm={confirmAction} onClose={() => setPendingAction(null)} />
    </section>
  );
}
