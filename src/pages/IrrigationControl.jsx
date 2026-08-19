import { CheckCircle2, Clock3, Droplets, Gauge, ShieldCheck } from "lucide-react";
import irrigationData from "../data/irrigation.json";
import { useLanguage } from "../context/LanguageContext";
import { useFarm } from "../context/FarmContext";
import { getIrrigationRecommendation } from "../utils/irrigationRecommendation";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import PumpControl from "../components/PumpControl";
import Icon from "../components/Icon";
import StatusBadge from "../components/StatusBadge";

export default function IrrigationControl() {
  const { t } = useLanguage();
  const { sensorData, motorDevices, runningMotorCount } = useFarm();
  const recommendation = getIrrigationRecommendation(sensorData);
  const fleetTone = runningMotorCount ? (runningMotorCount === motorDevices.length ? "success" : "warning") : "neutral";
  return (
    <div className="page-stack">
      <PageHeader kicker="CONNECTED MOTOR FLEET" title={t(irrigationData.headingKey)} description={t(irrigationData.descriptionKey)} actions={<StatusBadge tone={fleetTone} dot>{runningMotorCount} / {motorDevices.length} {t("irrigation.motorsRunning")}</StatusBadge>} />
      <div className="irrigation-layout irrigation-fleet-layout">
        <div className="irrigation-main">
          <PumpControl showRecommendation={false}/>
          <div className="irrigation-overview-grid">
            <div className="condition-grid">{irrigationData.conditions.map((condition) => <StatCard compact key={condition.id} label={t(condition.labelKey)} value={`${sensorData[condition.id]}${condition.suffix}`} icon={condition.icon} tone={condition.id === "rainProbability" ? "amber" : "blue"}/>)}</div>
            <section className="card safety-card"><header className="card-header"><h2><ShieldCheck size={19}/>Safety Monitor</h2></header>{irrigationData.warnings.map((warning) => <div className={`safety-row ${warning.severity}`} key={warning.type}><Icon name={warning.severity === "warning" ? "CloudRain" : "CheckCircle2"} size={18}/><div><strong>{t(warning.titleKey)}</strong><span>{t(warning.detailKey)}</span></div></div>)}</section>
          </div>
          <section className={`card irrigation-decision ${recommendation.irrigationRequired ? "required" : "not-required"}`}><div className="decision-icon">{recommendation.irrigationRequired ? <Droplets/> : <ShieldCheck/>}</div><div className="decision-copy"><span>SMART RECOMMENDATION</span><h2>{recommendation.irrigationRequired ? t("irrigation.recommendation") : "Irrigation Not Required"}</h2><p>{recommendation.reason}</p></div><div className="decision-numbers"><div><Clock3/><span>{t("irrigation.duration")}</span><strong>{recommendation.recommendedDuration} min</strong></div><div><Gauge/><span>{t("irrigation.estimated")}</span><strong>{recommendation.estimatedWater} L</strong></div></div></section>
          <section className="card event-table"><header className="card-header"><h2>{t("irrigation.history")}</h2></header><div className="table-scroll"><table><thead><tr><th>Date & Time</th><th>Mode</th><th>Duration</th><th>Water</th><th>Status</th></tr></thead><tbody>{irrigationData.events.map((event) => <tr key={event.date}><td>{event.date}</td><td>{t(event.modeKey)}</td><td>{event.duration}</td><td>{event.water}</td><td><StatusBadge tone="success"><CheckCircle2 size={13}/>Complete</StatusBadge></td></tr>)}</tbody></table></div></section>
        </div>
      </div>
    </div>
  );
}
