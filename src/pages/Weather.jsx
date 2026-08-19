import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarRange, ChevronLeft, ChevronRight, CloudRain, Compass, Droplets, Gauge, MapPin, Navigation, Sprout, SunMedium, Sunrise, Sunset, Wind } from "lucide-react";
import { Area, Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartCard from "../components/ChartCard";
import Icon from "../components/Icon";
import PageHeader from "../components/PageHeader";
import { useLanguage } from "../context/LanguageContext";
import farmMap from "../data/farmMap.json";
import settings from "../data/settings.json";
import { buildFallbackWeather, fetchFarmWeather, getWeatherMeta } from "../utils/weather";

const tooltipStyle = { borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)" };

function formatDate(date, language, options) {
  return new Intl.DateTimeFormat(language === "hi" ? "hi-IN" : "en-IN", options).format(new Date(`${date}T12:00:00`));
}

function formatDirection(degrees) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(degrees / 45) % 8];
}

function getAdvisoryKey(day) {
  if (day.rainProbability >= 65 || day.rain >= 8) return "weather.advisories.delayIrrigation";
  if (day.uv >= 7) return "weather.advisories.avoidMidday";
  if (day.wind >= 22) return "weather.advisories.strongWind";
  return "weather.advisories.favorable";
}

export default function Weather() {
  const { language, t } = useLanguage();
  const [weather, setWeather] = useState(() => buildFallbackWeather());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => weather.days[15].date);
  const timelineRef = useRef(null);
  const coordinates = farmMap.farm.coordinates;

  useEffect(() => {
    const controller = new AbortController();
    fetchFarmWeather(coordinates.lat, coordinates.lng, controller.signal)
      .then((nextWeather) => {
        setWeather(nextWeather);
        const todayDate = nextWeather.current.time.slice(0, 10);
        setSelectedDate(nextWeather.days.some((day) => day.date === todayDate) ? todayDate : nextWeather.days[15].date);
        setError(false);
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(true);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [coordinates.lat, coordinates.lng]);

  const todayIso = weather.current.time.slice(0, 10);
  const today = weather.days.find((day) => day.date === todayIso) || weather.days[15];
  const selectedDay = weather.days.find((day) => day.date === selectedDate) || today;
  const currentMeta = getWeatherMeta(weather.current.weatherCode);
  const selectedMeta = getWeatherMeta(selectedDay.weatherCode);
  const pastDays = weather.days.filter((day) => day.date < todayIso).slice(-15);
  const futureDays = weather.days.filter((day) => day.date > todayIso).slice(0, 15);
  const timelineDays = [...pastDays, ...futureDays];
  const wettestMonth = useMemo(() => weather.months.reduce((wettest, month) => month.rain > wettest.rain ? month : wettest, weather.months[0]), [weather.months]);
  const chartDays = weather.days.map((day) => ({ ...day, label: formatDate(day.date, language, { day: "numeric", month: "short" }) }));
  const monthChart = weather.months.map((month) => ({ ...month, label: formatDate(month.date, language, { month: "short" }) }));
  const sourceLabel = loading ? t("weather.updating") : weather.source === "live" ? t("weather.liveData") : t("weather.previewData");

  const scrollTimeline = (direction) => {
    timelineRef.current?.scrollBy({ left: direction * 560, behavior: "smooth" });
  };

  return (
    <div className="page-stack weather-page">
      <PageHeader kicker={t("weather.kicker")} title={t("weather.title")} description={t("weather.description")} actions={<span className={`weather-source ${weather.source}`}><i />{sourceLabel}</span>} />
      {error && <div className="inline-notice warning">{t("weather.offlineNotice")}</div>}

      <section className={`weather-hero card ${currentMeta.tone}`}>
        <div className="weather-current">
          <span className="weather-location"><MapPin size={15} />{settings.farm.name} · {settings.farm.location}</span>
          <div className="weather-current-reading"><span className="weather-main-icon"><Icon name={currentMeta.icon} size={42} /></span><div><strong>{Math.round(weather.current.temperature)}°</strong><span>{t(currentMeta.key)}</span><small>{t("weather.feelsLike")} {Math.round(weather.current.feelsLike)}°C</small></div></div>
          <span className="weather-updated">{t("common.lastUpdated")}: {new Intl.DateTimeFormat(language === "hi" ? "hi-IN" : "en-IN", { hour: "2-digit", minute: "2-digit" }).format(new Date(weather.current.time))}</span>
        </div>
        <div className="weather-current-stats">
          <div><Droplets size={18} /><span>{t("weather.humidity")}</span><strong>{Math.round(weather.current.humidity)}%</strong></div>
          <div><CloudRain size={18} /><span>{t("weather.precipitation")}</span><strong>{weather.current.precipitation.toFixed(1)} mm</strong></div>
          <div><Wind size={18} /><span>{t("weather.wind")}</span><strong>{Math.round(weather.current.wind)} km/h</strong></div>
          <div><Compass size={18} /><span>{t("weather.direction")}</span><strong>{formatDirection(weather.current.windDirection)}</strong></div>
          <div><Icon name="Cloudy" size={18} /><span>{t("weather.cloudCover")}</span><strong>{Math.round(weather.current.cloudCover)}%</strong></div>
          <div><Sprout size={18} /><span>{t("weather.fieldStatus")}</span><strong>{t("weather.monitor")}</strong></div>
        </div>
      </section>

      <section className="card weather-window-card">
        <header className="card-header weather-section-header"><div><h2><CalendarRange size={18} />{t("weather.thirtyDayTitle")}</h2><p>{t("weather.thirtyDayDescription")}</p></div><div className="weather-window-counts"><span>{pastDays.length} {t("weather.previous")}</span><button type="button" className={selectedDate === todayIso ? "active" : ""} onClick={() => setSelectedDate(todayIso)}>{t("common.today")}</button><span>{futureDays.length} {t("weather.next")}</span></div></header>
        <div className="weather-day-navigator">
          <button type="button" className="device-slide-arrow" onClick={() => scrollTimeline(-1)} aria-label={t("weather.previousDays")}><ChevronLeft size={17} /></button>
          <div className="weather-day-viewport" ref={timelineRef}>
            <div className="weather-day-track">
              {timelineDays.map((day) => {
                const meta = getWeatherMeta(day.weatherCode);
                const isPast = day.date < todayIso;
                return <button type="button" className={`weather-day-card ${selectedDate === day.date ? "active" : ""} ${isPast ? "past" : "future"}`} key={day.date} onClick={() => setSelectedDate(day.date)}><small>{isPast ? t("weather.recorded") : t("weather.forecast")}</small><strong>{formatDate(day.date, language, { weekday: "short" })}</strong><span>{formatDate(day.date, language, { day: "numeric", month: "short" })}</span><Icon name={meta.icon} size={24} /><b>{Math.round(day.high)}° <i>{Math.round(day.low)}°</i></b><em><Droplets size={12} />{Math.round(day.rainProbability)}%</em></button>;
              })}
            </div>
          </div>
          <button type="button" className="device-slide-arrow" onClick={() => scrollTimeline(1)} aria-label={t("weather.nextDays")}><ChevronRight size={17} /></button>
        </div>
        <div className="weather-selected-day">
          <div className="selected-day-heading"><span className={`selected-weather-icon ${selectedMeta.tone}`}><Icon name={selectedMeta.icon} size={28} /></span><div><small>{selectedDay.date === todayIso ? t("common.today") : selectedDay.date < todayIso ? t("weather.recordedWeather") : t("weather.dailyForecast")}</small><h3>{formatDate(selectedDay.date, language, { weekday: "long", day: "numeric", month: "long" })}</h3><span>{t(selectedMeta.key)}</span></div><strong>{Math.round(selectedDay.high)}° <small>/ {Math.round(selectedDay.low)}°</small></strong></div>
          <div className="selected-day-metrics">
            <div><Droplets size={17} /><span>{t("weather.humidity")}<strong>{Math.round(selectedDay.humidity)}%</strong></span></div>
            <div><CloudRain size={17} /><span>{t("weather.rainChance")}<strong>{Math.round(selectedDay.rainProbability)}% · {selectedDay.rain.toFixed(1)} mm</strong></span></div>
            <div><Wind size={17} /><span>{t("weather.maxWind")}<strong>{Math.round(selectedDay.wind)} km/h</strong></span></div>
            <div><SunMedium size={17} /><span>{t("weather.uvIndex")}<strong>{selectedDay.uv.toFixed(1)}</strong></span></div>
            <div><Sunrise size={17} /><span>{t("weather.sunrise")}<strong>{selectedDay.sunrise}</strong></span></div>
            <div><Sunset size={17} /><span>{t("weather.sunset")}<strong>{selectedDay.sunset}</strong></span></div>
            <div><Gauge size={17} /><span>{t("weather.feelsLike")}<strong>{Math.round(selectedDay.feelsLike)}°C</strong></span></div>
            <div><Navigation size={17} /><span>{t("weather.evapotranspiration")}<strong>{selectedDay.evapotranspiration.toFixed(1)} mm</strong></span></div>
          </div>
          <div className="weather-farm-advisory"><Sprout size={19} /><span><small>{t("weather.farmAdvisory")}</small><strong>{t(getAdvisoryKey(selectedDay))}</strong></span></div>
        </div>
      </section>

      <ChartCard title={t("weather.temperatureRainTrend")} action={<span className="weather-chart-legend"><i className="high" />{t("weather.high")}<i className="low" />{t("weather.low")}<i className="rain" />{t("weather.rain")}</span>}>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartDays} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}><CartesianGrid stroke="var(--chart-grid)" vertical={false} /><XAxis dataKey="label" interval={4} axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} /><YAxis yAxisId="temp" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} unit="°" /><YAxis yAxisId="rain" orientation="right" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} unit=" mm" /><Tooltip contentStyle={tooltipStyle} /><Bar yAxisId="rain" dataKey="rain" name={t("weather.rain")} fill="var(--blue)" opacity={0.35} radius={[4, 4, 0, 0]} /><Area yAxisId="temp" type="monotone" dataKey="high" name={t("weather.high")} stroke="var(--amber)" fill="color-mix(in srgb, var(--amber) 10%, transparent)" strokeWidth={2.5} /><Line yAxisId="temp" type="monotone" dataKey="low" name={t("weather.low")} stroke="var(--green)" strokeWidth={2.5} dot={false} /></ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      <section className="card seasonal-outlook-card">
        <header className="card-header weather-section-header"><div><h2><Icon name="ChartNoAxesCombined" size={18} />{t("weather.sixMonthTitle")}</h2><p>{t("weather.sixMonthDescription")}</p></div><span className={`weather-source ${weather.seasonalSource}`}><i />{weather.seasonalSource === "live" ? t("weather.seasonalModel") : t("weather.previewData")}</span></header>
        <div className="seasonal-layout">
          <div className="seasonal-months">
            {weather.months.map((month) => <article className="seasonal-month-card" key={month.date}><header><span>{formatDate(month.date, language, { month: "short" })}</span><small>{formatDate(month.date, language, { year: "numeric" })}</small></header><strong>{Math.round(month.average)}°C</strong><p>{Math.round(month.high)}° / {Math.round(month.low)}°</p><div><span><CloudRain size={14} />{Math.round(month.rain)} mm</span><span><Icon name="Cloudy" size={14} />{Math.round(month.cloudCover)}%</span><span><Wind size={14} />{Math.round(month.wind)} km/h</span></div></article>)}
          </div>
          <div className="seasonal-chart">
            <ResponsiveContainer width="100%" height={230}>
              <ComposedChart data={monthChart} margin={{ top: 12, right: 8, left: -24, bottom: 0 }}><CartesianGrid stroke="var(--chart-grid)" vertical={false} /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} /><YAxis yAxisId="temp" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} unit="°" /><YAxis yAxisId="rain" orientation="right" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} /><Tooltip contentStyle={tooltipStyle} /><Bar yAxisId="rain" dataKey="rain" name={t("weather.rain")} fill="var(--blue)" opacity={0.5} radius={[5, 5, 0, 0]} /><Line yAxisId="temp" type="monotone" dataKey="average" name={t("weather.averageTemperature")} stroke="var(--green)" strokeWidth={3} dot={{ r: 4, fill: "var(--green)", stroke: "var(--card)", strokeWidth: 2 }} /></ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="seasonal-note"><Icon name="BadgeInfo" size={18} /><span><strong>{t("weather.planningInsight")}</strong><p>{formatDate(wettestMonth.date, language, { month: "long" })} {t("weather.wettestMonthNote")} {Math.round(wettestMonth.rain)} mm. {t("weather.seasonalDisclaimer")}</p></span></div>
      </section>
    </div>
  );
}
