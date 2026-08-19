import Icon from "./Icon";

export default function StatCard({ label, value, note, icon, tone = "green", compact = false }) {
  return (
    <article className={`card stat-card ${tone} ${compact ? "compact" : ""}`}>
      <div className="stat-icon"><Icon name={icon} size={23} /></div>
      <div className="stat-body"><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>
    </article>
  );
}
