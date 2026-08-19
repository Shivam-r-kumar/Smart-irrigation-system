import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import StatusBadge from "./StatusBadge";

const severityIcons = { critical: AlertCircle, warning: TriangleAlert, info: Info };

export default function AlertCard({ alert, t, onResolve }) {
  const SeverityIcon = severityIcons[alert.severity] || Info;
  return (
    <article className={`alert-card ${alert.severity}`}>
      <div className="alert-symbol"><SeverityIcon size={20} /></div>
      <div className="alert-copy"><div className="alert-title-row"><h3>{t(alert.titleKey)}</h3><StatusBadge tone={alert.severity}>{alert.severity}</StatusBadge></div><p>{t(alert.detailKey)}</p><div className="alert-meta"><span>{alert.device}</span><span>{alert.time}</span></div></div>
      {alert.status === "active" ? <button className="button ghost small" onClick={() => onResolve?.(alert.id)}><CheckCircle2 size={15} />{t("alerts.markResolved")}</button> : <StatusBadge tone="success">{t("common.resolved")}</StatusBadge>}
    </article>
  );
}
