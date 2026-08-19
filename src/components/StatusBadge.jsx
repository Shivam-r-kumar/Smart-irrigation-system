export default function StatusBadge({ tone = "neutral", children, dot = false }) {
  return <span className={`status-badge ${tone}`}>{dot && <i />}{children}</span>;
}
