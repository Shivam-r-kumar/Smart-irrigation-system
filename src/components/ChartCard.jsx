export default function ChartCard({ title, subtitle, action, className = "", children }) {
  return (
    <section className={`card chart-card ${className}`}>
      <header className="card-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</header>
      <div className="chart-body">{children}</div>
    </section>
  );
}
