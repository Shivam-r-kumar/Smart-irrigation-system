export default function PageHeader({ kicker, title, description, actions }) {
  return (
    <header className="page-header">
      <div>{kicker && <span className="eyebrow">{kicker}</span>}<h1>{title}</h1><p>{description}</p></div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}
