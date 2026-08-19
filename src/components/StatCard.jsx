import Icon from "./Icon";

export default function StatCard({ label, value, note, icon, tone = "green", compact = false, onClick, historyLabel = "View sensor history" }) {
  const Card = onClick ? "button" : "article";
  return (
    <Card type={onClick ? "button" : undefined} className={`card stat-card ${tone} ${compact ? "compact" : ""} ${onClick ? "clickable" : ""}`} onClick={onClick} aria-label={onClick ? `${label}: ${historyLabel}` : undefined} aria-haspopup={onClick ? "dialog" : undefined}>
      <div className="stat-icon"><Icon name={icon} size={23} /></div>
      <div className="stat-body"><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>
    </Card>
  );
}
