import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, CircleAlert, CircleUserRound, CloudSun, Languages, Menu, Moon, Settings, Sun, Wifi } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import navigation from "../data/navigation.json";
import alertData from "../data/alerts.json";
import settings from "../data/settings.json";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { useFarm } from "../context/FarmContext";

export default function Navbar({ onMenu }) {
  const { pathname } = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { connection } = useFarm();
  const [openMenu, setOpenMenu] = useState(null);
  const actionsRef = useRef(null);
  const navItem = navigation.find((item) => pathname.startsWith(item.path)) || navigation[0];
  const allActiveAlerts = alertData.alerts.filter((alert) => alert.status === "active");
  const activeAlerts = allActiveAlerts.slice(0, 3);

  useEffect(() => setOpenMenu(null), [pathname]);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!actionsRef.current?.contains(event.target)) setOpenMenu(null);
    };
    const closeOnEscape = (event) => event.key === "Escape" && setOpenMenu(null);
    document.addEventListener("pointerdown", closeOnOutsideClick);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-title">
        <button className="mobile-menu icon-button" onClick={onMenu} aria-label={t("navbar.openMenu")}><Menu /></button>
        <div><b>AgriSmart</b><span>{t(navItem.labelKey)}</span></div>
      </div>
      <div className="topbar-actions" ref={actionsRef}>
        <span className={`connection-chip ${connection}`}><Wifi size={15} />{connection === "live" ? t("common.live") : t("common.demo")}</span>
        <span className="weather"><CloudSun size={20} />{t("navbar.weather")}</span>
        <button className="language-switch" onClick={() => { setOpenMenu(null); setLanguage(language === "en" ? "hi" : "en"); }} aria-label={t("navbar.language")}>
          <Languages size={18} /><b>{language === "en" ? "English" : "हिन्दी"}</b><span>{language === "en" ? "हिन्दी" : "English"}</span>
        </button>
        <button className="icon-button header-icon" onClick={() => { setOpenMenu(null); toggleTheme(); }} aria-label={t("navbar.theme")}>
          {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
        </button>
        <div className="header-menu-wrap">
          <button className="icon-button header-icon notification-button" onClick={() => setOpenMenu((current) => current === "alerts" ? null : "alerts")} aria-label={t("navbar.notifications")} aria-expanded={openMenu === "alerts"} aria-controls="notification-menu"><Bell size={19} /><i /><b>{allActiveAlerts.length}</b></button>
          {openMenu === "alerts" && <section className="header-popover notification-menu" id="notification-menu" aria-label={t("navbar.recentAlerts")}><header><div><span>{t("navbar.notifications")}</span><strong>{allActiveAlerts.length} {t("common.active")}</strong></div></header><div className="header-alert-list">{activeAlerts.map((alert) => <Link to="/alerts" className={`header-alert-item ${alert.severity}`} key={alert.id}><CircleAlert size={17}/><span><strong>{t(alert.titleKey)}</strong><small>{alert.device} · {alert.time}</small></span></Link>)}</div><Link className="popover-footer-link" to="/alerts">{t("navbar.viewAllAlerts")}</Link></section>}
        </div>
        <div className="header-menu-wrap profile-menu-wrap">
          <button className="profile-button" onClick={() => setOpenMenu((current) => current === "profile" ? null : "profile")} aria-label={t("navbar.profile")} aria-expanded={openMenu === "profile"} aria-controls="profile-menu"><CircleUserRound size={29} /><ChevronDown size={15} /></button>
          {openMenu === "profile" && <section className="header-popover profile-menu" id="profile-menu" aria-label={t("navbar.account")}><div className="profile-summary"><CircleUserRound size={38}/><span><strong>{settings.profile.name}</strong><small>{settings.profile.email}</small></span></div><div className="profile-farm"><span>{t("settings.farm")}</span><strong>{settings.farm.name}</strong><small>{settings.farm.location}</small></div><Link className="profile-settings-link" to="/settings"><Settings size={16}/>{t("navbar.manageAccount")}</Link></section>}
        </div>
      </div>
    </header>
  );
}
