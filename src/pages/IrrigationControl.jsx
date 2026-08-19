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
  const { sensorData } = useFarm();
  const recommendation = getIrrigationRecommendation(sensorData);
  return (
    <div className="page-stack">
      <PageHeader kicker="ZONE A · FIELD-001" title={t(irrigationData.headingKey)} description={t(irrigationData.descriptionKey)} actions={<StatusBadge tone={sensorData.pumpState ? "success" : "neutral"} dot>{sensorData.pumpState ? t("irrigation.pumpOn") : t("irrigation.pumpOff")}</StatusBadge>} />
      <div className="irrigation-layout">
        <div className="irrigation-main">
          <div className="condition-grid">{irrigationData.conditions.map((condition) => <StatCard compact key={condition.id} label={t(condition.labelKey)} value={`${sensorData[condition.id]}${condition.suffix}`} icon={condition.icon} tone={condition.id === "rainProbability" ? "amber" : "blue"}/>)}</div>
          <section className={`card irrigation-decision ${recommendation.irrigationRequired ? "required" : "not-required"}`}><div className="decision-icon">{recommendation.irrigationRequired ? <Droplets/> : <ShieldCheck/>}</div><div className="decision-copy"><span>SMART RECOMMENDATION</span><h2>{recommendation.irrigationRequired ? t("irrigation.recommendation") : "Irrigation Not Required"}</h2><p>{recommendation.reason}</p></div><div className="decision-numbers"><div><Clock3/><span>{t("irrigation.duration")}</span><strong>{recommendation.recommendedDuration} min</strong></div><div><Gauge/><span>{t("irrigation.estimated")}</span><strong>{recommendation.estimatedWater} L</strong></div></div></section>
          <section className="card event-table"><header className="card-header"><h2>{t("irrigation.history")}</h2></header><div className="table-scroll"><table><thead><tr><th>Date & Time</th><th>Mode</th><th>Duration</th><th>Water</th><th>Status</th></tr></thead><tbody>{irrigationData.events.map((event) => <tr key={event.date}><td>{event.date}</td><td>{t(event.modeKey)}</td><td>{event.duration}</td><td>{event.water}</td><td><StatusBadge tone="success"><CheckCircle2 size={13}/>Complete</StatusBadge></td></tr>)}</tbody></table></div></section>
        </div>
        <aside className="irrigation-rail"><PumpControl showRecommendation={false}/><section className="card safety-card"><header className="card-header"><h2><ShieldCheck size={19}/>Safety Monitor</h2></header>{irrigationData.warnings.map((warning) => <div className={`safety-row ${warning.severity}`} key={warning.type}><Icon name={warning.severity === "warning" ? "CloudRain" : "CheckCircle2"} size={18}/><div><strong>{t(warning.titleKey)}</strong><span>{t(warning.detailKey)}</span></div></div>)}</section></aside>
      </div>
    </div>
  );
}
