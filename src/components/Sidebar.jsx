import { Link, NavLink } from "react-router-dom";
import { Droplet, Leaf, X } from "lucide-react";
import navigation from "../data/navigation.json";
import alertData from "../data/alerts.json";
import { useLanguage } from "../context/LanguageContext";
import Icon from "./Icon";

export default function Sidebar({ open, onClose }) {
  const { t } = useLanguage();
  const activeAlertCount = alertData.alerts.filter((alert) => alert.status === "active").length;
  return (
    <>
      <button className={`sidebar-backdrop ${open ? "show" : ""}`} onClick={onClose} aria-label="Close navigation" />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <Link className="brand-home" to="/dashboard" onClick={onClose} aria-label={`${t("brand.name")} ${t("nav.dashboard")}`}>
            <span className="brand-mark"><Droplet size={25} /><Leaf size={18} /></span>
            <span className="brand-name">{t("brand.name")}</span>
          </Link>
          <button className="sidebar-close icon-button" onClick={onClose} aria-label="Close navigation"><X /></button>
        </div>
        <nav className="sidebar-nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <NavLink key={item.path} to={item.path} onClick={onClose} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              <Icon name={item.icon} size={20} />
              <span>{t(item.labelKey)}</span>
              {item.path === "/alerts" && <b className="alert-count">{activeAlertCount}</b>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="plant-illustration"><i /><i /><i /></div>
          <strong>{t("brand.tagline")}</strong>
          <span>{t("brand.promise")}</span>
        </div>
      </aside>
    </>
  );
}
