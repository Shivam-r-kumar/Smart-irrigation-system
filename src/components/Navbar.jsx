import { Bell, ChevronDown, CircleUserRound, CloudSun, Languages, Menu, Moon, Sun, Wifi } from "lucide-react";
import { useLocation } from "react-router-dom";
import navigation from "../data/navigation.json";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { useFarm } from "../context/FarmContext";

export default function Navbar({ onMenu }) {
  const { pathname } = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { connection } = useFarm();
  const navItem = navigation.find((item) => pathname.startsWith(item.path)) || navigation[0];

  return (
    <header className="topbar">
      <div className="topbar-title">
        <button className="mobile-menu icon-button" onClick={onMenu} aria-label={t("navbar.openMenu")}><Menu /></button>
        <div><b>AgriSmart</b><span>{t(navItem.labelKey)}</span></div>
      </div>
      <div className="topbar-actions">
        <span className={`connection-chip ${connection}`}><Wifi size={15} />{connection === "live" ? t("common.live") : t("common.demo")}</span>
        <span className="weather"><CloudSun size={20} />{t("navbar.weather")}</span>
        <button className="language-switch" onClick={() => setLanguage(language === "en" ? "hi" : "en")} aria-label={t("navbar.language")}>
          <Languages size={18} /><b>{language === "en" ? "English" : "हिन्दी"}</b><span>{language === "en" ? "हिन्दी" : "English"}</span>
        </button>
        <button className="icon-button header-icon" onClick={toggleTheme} aria-label={t("navbar.theme")}>
          {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
        </button>
        <button className="icon-button header-icon notification-button" aria-label={t("navbar.notifications")}><Bell size={19} /><i /></button>
        <button className="profile-button" aria-label={t("navbar.profile")}><CircleUserRound size={29} /><ChevronDown size={15} /></button>
      </div>
    </header>
  );
}
