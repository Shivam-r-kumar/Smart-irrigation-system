import { Download, X } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useState } from "react";
import reports from "../data/reports.json";
import { useLanguage } from "../context/LanguageContext";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";

const tooltip = { background:"var(--card)", border:"1px solid var(--border)", borderRadius:10 };

export default function Reports({ embedded = false, onClose }) {
  const { t } = useLanguage();
  const [range, setRange] = useState("7");
  const pieData = reports.eventSplit.map((item) => ({ ...item, name:t(item.nameKey) }));
  const reportActions = <><select className="range-select" value={range} onChange={(event) => setRange(event.target.value)} aria-label={t("reports.range")}><option value="7">{t("reports.last7")}</option><option value="30">{t("reports.last30")}</option><option value="season">{t("reports.season")}</option></select><button className="button secondary" type="button"><Download size={16}/>Export</button></>;
  return (
    <div className={embedded ? "report-popup-content" : "page-stack"}>
      {embedded ? <header className="report-popup-header"><div><span className="eyebrow">EFFICIENCY INSIGHTS</span><h2 id="report-modal-title">{t(reports.headingKey)}</h2><p>{t(reports.descriptionKey)}</p></div><div className="report-popup-actions">{reportActions}<button className="icon-button report-popup-close" type="button" onClick={onClose} aria-label={t("reports.close")}><X size={19}/></button></div></header> : <PageHeader kicker="EFFICIENCY INSIGHTS" title={t(reports.headingKey)} description={t(reports.descriptionKey)} actions={reportActions} />}
      <div className="report-summary">{reports.summary.map((item) => <StatCard key={item.labelKey} label={t(item.labelKey)} value={item.value} note={item.change} icon={item.icon} tone={item.tone}/>)}</div>
      <div className="report-charts">
        <ChartCard title={t("reports.usageVsSaved")} className="wide"><ResponsiveContainer width="100%" height={280}><BarChart data={reports.daily} margin={{ top:10, right:10, left:-20, bottom:0 }}><CartesianGrid stroke="var(--chart-grid)" vertical={false}/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill:"var(--muted)", fontSize:11 }}/><YAxis axisLine={false} tickLine={false} tick={{ fill:"var(--muted)", fontSize:11 }}/><Tooltip contentStyle={tooltip}/><Legend/><Bar name={t("reports.waterUsage")} dataKey="usage" fill="var(--blue)" radius={[5,5,0,0]}/><Bar name={t("reports.saved")} dataKey="saved" fill="var(--green)" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></ChartCard>
        <ChartCard title={t("reports.eventSplit")}><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={pieData} dataKey="value" innerRadius={65} outerRadius={92} paddingAngle={4}>{pieData.map((item) => <Cell fill={item.color} key={item.name}/>)}</Pie><Tooltip contentStyle={tooltip}/><Legend/></PieChart></ResponsiveContainer></ChartCard>
        <ChartCard title={t("reports.conditionTrends")} className="wide"><ResponsiveContainer width="100%" height={280}><AreaChart data={reports.conditions} margin={{ top:10, right:10, left:-20, bottom:0 }}><defs><linearGradient id="moistureFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--green)" stopOpacity={.26}/><stop offset="95%" stopColor="var(--green)" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="var(--chart-grid)" vertical={false}/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill:"var(--muted)", fontSize:11 }}/><YAxis axisLine={false} tickLine={false} tick={{ fill:"var(--muted)", fontSize:11 }}/><Tooltip contentStyle={tooltip}/><Legend/><Area name={t("metrics.soilMoisture")} type="monotone" dataKey="moisture" stroke="var(--green)" strokeWidth={3} fill="url(#moistureFill)"/><Area name={t("metrics.temperature")} type="monotone" dataKey="temperature" stroke="var(--amber)" strokeWidth={2} fill="transparent"/></AreaChart></ResponsiveContainer></ChartCard>
        <section className="card efficiency-card"><span className="eyebrow">SMART IRRIGATION IMPACT</span><h2>36%</h2><p>less water used compared with scheduled irrigation</p><div className="efficiency-orbit"><i/><b>1,540 L</b><span>saved</span></div></section>
      </div>
    </div>
  );
}
