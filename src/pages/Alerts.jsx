import { Filter, Search } from "lucide-react";
import { useMemo, useState } from "react";
import alertData from "../data/alerts.json";
import { useLanguage } from "../context/LanguageContext";
import PageHeader from "../components/PageHeader";
import AlertCard from "../components/AlertCard";
import EmptyState from "../components/EmptyState";

export default function Alerts() {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState(alertData.alerts);
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");
  const [device, setDevice] = useState("all");
  const [search, setSearch] = useState("");
  const devices = [...new Set(alerts.map((alert) => alert.device))];
  const visible = useMemo(() => alerts.filter((alert) => (severity === "all" || alert.severity === severity) && (status === "all" || alert.status === status) && (device === "all" || alert.device === device) && t(alert.titleKey).toLowerCase().includes(search.toLowerCase())), [alerts, severity, status, device, search, t]);
  const resolveAlert = (id) => setAlerts((current) => current.map((alert) => alert.id === id ? { ...alert, status:"resolved" } : alert));
  return (
    <div className="page-stack">
      <PageHeader kicker="FARM OPERATIONS" title={t(alertData.headingKey)} description={t(alertData.descriptionKey)} />
      <section className="card alert-filters"><div className="search-box"><Search size={17}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search alerts"/></div><label><Filter size={15}/><select value={severity} onChange={(event) => setSeverity(event.target.value)}><option value="all">{t("common.all")} {t("alerts.severity")}</option><option value="critical">Critical</option><option value="warning">Warning</option><option value="info">Information</option></select></label><label><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">{t("common.all")} {t("alerts.status")}</option><option value="active">{t("common.active")}</option><option value="resolved">{t("common.resolved")}</option></select></label><label><select value={device} onChange={(event) => setDevice(event.target.value)}><option value="all">{t("common.all")} {t("alerts.device")}</option>{devices.map((item) => <option key={item}>{item}</option>)}</select></label></section>
      <div className="alert-summary"><div><b>{alerts.filter((item) => item.status === "active").length}</b><span>{t("common.active")}</span></div><div className="critical"><b>{alerts.filter((item) => item.severity === "critical" && item.status === "active").length}</b><span>Critical</span></div><div className="warning"><b>{alerts.filter((item) => item.severity === "warning" && item.status === "active").length}</b><span>Warning</span></div><div><b>{alerts.filter((item) => item.status === "resolved").length}</b><span>{t("common.resolved")}</span></div></div>
      <section className="card alerts-list">{visible.length ? visible.map((alert) => <AlertCard key={alert.id} alert={alert} t={t} onResolve={resolveAlert}/>) : <EmptyState message={t("alerts.noAlerts")}/>}</section>
    </div>
  );
}
