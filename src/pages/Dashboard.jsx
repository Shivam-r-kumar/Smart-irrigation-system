import { Link } from "react-router-dom";
import { ArrowRight, Leaf, Sprout, TrendingDown } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import dashboard from "../data/dashboard.json";
import { useLanguage } from "../context/LanguageContext";
import { useSensorData } from "../hooks/useSensorData";
import { formatMetric } from "../utils/formatters";
import StatCard from "../components/StatCard";
import PumpControl from "../components/PumpControl";
import ChartCard from "../components/ChartCard";
import Icon from "../components/Icon";
import LoadingSpinner from "../components/LoadingSpinner";

const tooltipStyle = { borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)" };

export default function Dashboard() {
  const { t } = useLanguage();
  const { data, loading, error, connection } = useSensorData();
  if (loading) return <LoadingSpinner label={t("common.loading")} />;

  return (
    <div className="page-stack dashboard-page">
      {error && <div className="inline-notice warning">Live connection is unavailable. Showing safe demo data.</div>}
      <section className="farm-hero">
        <div className="hero-copy"><span className="eyebrow">{t(dashboard.heroKickerKey)} · {connection === "live" ? t("common.live") : t("common.demo")}</span><h1>{t(dashboard.headingKey)}</h1><p>{t(dashboard.descriptionKey)}</p><div className="hero-rule" /></div>
        <div className="field-scene" aria-hidden="true"><div className="sun-disc" /><div className="farmhouse" /><div className="tractor">●━●</div><div className="crop-rows" /><div className="irrigation-arc one" /><div className="irrigation-arc two" /></div>
      </section>

      <div className="dashboard-columns">
        <section className="dashboard-main">
          <div className="sensor-grid">
            {dashboard.metrics.map((metric) => (
              <StatCard key={metric.id} label={t(metric.labelKey)} value={formatMetric(data[metric.id], metric.suffix)} note={t(metric.statusKey)} icon={metric.icon} tone={metric.tone} />
            ))}
          </div>

          <div className="dashboard-charts">
            <ChartCard title={t("dashboard.moistureTrend")} action={<span className="live-indicator"><i />{t("common.live")}</span>}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={dashboard.moistureTrend} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}><CartesianGrid stroke="var(--chart-grid)" vertical={false} /><XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} domain={[20, 80]} /><Tooltip contentStyle={tooltipStyle} /><Line type="monotone" dataKey="value" stroke="#2d77df" strokeWidth={3} dot={{ r: 4, fill: "#2d77df", strokeWidth: 2, stroke: "var(--card)" }} activeDot={{ r: 6 }} /></LineChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title={t("dashboard.waterUsage")}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dashboard.waterUsage} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}><CartesianGrid stroke="var(--chart-grid)" vertical={false} /><XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="litres" fill="#2f79dc" radius={[5, 5, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="dashboard-bottom">
            <section className="card crop-quick-card">
              <header className="card-header"><h2><Sprout size={19} />{t("dashboard.quickCrop")}</h2><Link to="/crop-recommendation">{t("common.viewAll")} <ArrowRight size={15} /></Link></header>
              <div className="crop-best"><div className="crop-orb"><Leaf size={32} /></div><div><span>{t("dashboard.bestCrop")}</span><h3>Wheat <b>92%</b></h3><p>{t("dashboard.otherCrops")}: <strong>Chickpea, Mustard</strong></p></div></div>
              <div className="crop-note"><TrendingDown size={20} /><p>{t("dashboard.why")}</p></div>
            </section>
            <section className="card activity-card">
              <header className="card-header"><h2>{t("dashboard.activity")}</h2><Link to="/alerts">{t("common.viewAll")} <ArrowRight size={15} /></Link></header>
              <div className="activity-list">{dashboard.activities.map((activity) => <div className="activity-row" key={activity.titleKey}><div className={`activity-icon ${activity.severity}`}><Icon name={activity.icon} size={16} /></div><div><strong>{t(activity.titleKey)}</strong><small>{t(activity.categoryKey)}</small></div><time>{activity.time}</time></div>)}</div>
            </section>
          </div>
        </section>
        <aside className="dashboard-rail">
          <PumpControl compact />
          <section className="card npk-card"><header className="card-header"><h2>{t("dashboard.npkBalance")}</h2></header><div className="npk-list">{dashboard.npk.map((item) => <div key={item.nameKey}><div><span>{t(item.nameKey)}</span><strong>{item.value} kg/ha</strong></div><span className="progress-track"><i style={{ width: `${Math.min(item.value / item.target * 100, 100)}%`, background: item.color }} /></span></div>)}</div></section>
        </aside>
      </div>
    </div>
  );
}
