import { CheckCircle2, FlaskConical, Lightbulb, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import soilData from "../data/soilAnalysis.json";
import { useLanguage } from "../context/LanguageContext";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import ChartCard from "../components/ChartCard";

export default function SoilAnalysis() {
  const { t } = useLanguage();
  return (
    <div className="page-stack">
      <PageHeader kicker="FIELD A · SOIL LAB" title={t(soilData.headingKey)} description={t(soilData.descriptionKey)} actions={<button className="button primary"><FlaskConical size={17} />Upload Soil Test</button>} />
      <div className="soil-overview-grid">
        <section className="card health-card"><div className="health-ring" style={{ "--score": `${soilData.healthScore * 3.6}deg` }}><div><strong>{soilData.healthScore}</strong><span>/ 100</span></div></div><div><span>{t("soil.overallHealth")}</span><h2>{t("status.good")}</h2><p>{t("soil.sample")}: {soilData.sample}</p><StatusBadge tone="success" dot>{t("status.healthy")}</StatusBadge></div></section>
        <ChartCard title={t("soil.trend")} className="soil-trend">
          <ResponsiveContainer width="100%" height={210}><AreaChart data={soilData.history} margin={{ top: 8, right: 10, left: -25, bottom: 0 }}><defs><linearGradient id="healthFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#269b55" stopOpacity={0.32}/><stop offset="95%" stopColor="#269b55" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="var(--chart-grid)" vertical={false}/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill:"var(--muted)", fontSize:11 }}/><YAxis domain={[50,100]} axisLine={false} tickLine={false} tick={{ fill:"var(--muted)", fontSize:11 }}/><Tooltip contentStyle={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:10 }}/><Area type="monotone" dataKey="health" stroke="#269b55" strokeWidth={3} fill="url(#healthFill)"/></AreaChart></ResponsiveContainer>
        </ChartCard>
      </div>
      <section><div className="section-title"><div><span className="eyebrow">LATEST LAB VALUES</span><h2>{t("soil.nutrientProfile")}</h2></div></div><div className="soil-parameter-grid">{soilData.parameters.map((item) => <article className={`card parameter-card ${item.tone}`} key={item.id}><header><span>{t(item.labelKey)}</span><StatusBadge tone={item.score < 55 ? "warning" : "success"}>{t(item.statusKey)}</StatusBadge></header><div className="parameter-value"><strong>{item.value}</strong><small>{item.unit}</small></div><span className="progress-track"><i style={{ width:`${item.score}%` }}/></span><p>{item.score}% of the agronomic target</p></article>)}</div></section>
      <section className="card recommendation-card"><header className="card-header"><h2><Lightbulb size={20}/>{t("soil.recommendations")}</h2><StatusBadge tone="info"><TrendingUp size={13}/> 3 actions</StatusBadge></header><div className="recommendation-list">{soilData.recommendations.map((key, index) => <div key={key}><CheckCircle2 size={19}/><span><b>0{index + 1}</b>{t(key)}</span></div>)}</div></section>
    </div>
  );
}
