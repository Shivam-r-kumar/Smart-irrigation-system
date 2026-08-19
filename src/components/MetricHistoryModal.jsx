import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Activity, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchSensorHistory } from "../firebase/sensorService";
import { buildFallbackHistory, getRecentDays, limitHistoryToElapsedTime, normalizeSensorHistory } from "../utils/sensorHistory";
import { formatMetric } from "../utils/formatters";
import { useLanguage } from "../context/LanguageContext";
import Icon from "./Icon";

const toneColors = {
  blue: "#5c8f6e",
  green: "#32a363",
  amber: "#c99043",
  red: "#d46b58",
  cyan: "#4f9473",
  purple: "#748a76",
};

function formatValue(value, metric) {
  if (metric.id === "pumpState") return Number(value) >= 0.5 ? "ON" : "OFF";
  return formatMetric(value, metric.suffix);
}

function buildSummary(series, metric, currentValue, t) {
  if (metric.id === "pumpState") {
    const onHours = series.filter((point) => point.value >= 0.5).length;
    return [
      { label: t("history.onHours"), value: `${onHours}h` },
      { label: t("history.offHours"), value: `${Math.max(series.length - onHours, 0)}h` },
      { label: t("history.current"), value: formatValue(currentValue, metric) },
    ];
  }

  const values = series.map((point) => point.value);
  const minimum = values.length ? Math.min(...values) : 0;
  const maximum = values.length ? Math.max(...values) : 0;
  const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const decimals = metric.id === "soilPH" || metric.id === "ec" ? 2 : 1;
  return [
    { label: t("history.minimum"), value: formatValue(Number(minimum.toFixed(decimals)), metric) },
    { label: t("history.average"), value: formatValue(Number(average.toFixed(decimals)), metric) },
    { label: t("history.maximum"), value: formatValue(Number(maximum.toFixed(decimals)), metric) },
    { label: t("history.current"), value: formatValue(currentValue, metric) },
  ];
}

export default function MetricHistoryModal({ metric, currentValue, deviceId, onClose }) {
  const { language, t } = useLanguage();
  const days = useMemo(() => getRecentDays(7), []);
  const [dayIndex, setDayIndex] = useState(days.length - 1);
  const [series, setSeries] = useState(() => limitHistoryToElapsedTime(buildFallbackHistory(metric.id, currentValue, days.at(-1).key), true));
  const [source, setSource] = useState("loading");
  const closeButtonRef = useRef(null);
  const selectedDay = days[dayIndex];
  const isToday = dayIndex === days.length - 1;
  const color = toneColors[metric.tone] || toneColors.green;
  const gradientId = `history-fill-${metric.id}`;
  const summary = buildSummary(series, metric, currentValue, t);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const handleKeyDown = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    let active = true;
    setSource("loading");
    fetchSensorHistory(deviceId, selectedDay.key)
      .then((records) => {
        if (!active) return;
        const normalized = limitHistoryToElapsedTime(normalizeSensorHistory(records, metric.id), isToday);
        if (normalized.length) {
          setSeries(normalized);
          setSource("live");
        } else {
          setSeries(limitHistoryToElapsedTime(buildFallbackHistory(metric.id, currentValue, selectedDay.key), isToday));
          setSource("preview");
        }
      })
      .catch(() => {
        if (!active) return;
        setSeries(limitHistoryToElapsedTime(buildFallbackHistory(metric.id, currentValue, selectedDay.key), isToday));
        setSource("preview");
      });
    return () => { active = false; };
  }, [currentValue, deviceId, isToday, metric.id, selectedDay.key]);

  const dateLabel = selectedDay.date.toLocaleDateString(language === "hi" ? "hi-IN" : "en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const currentTimeLabel = new Date().toLocaleTimeString(language === "hi" ? "hi-IN" : "en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  const readingWindow = isToday ? `00:00–${currentTimeLabel}` : t("history.fullDay");

  return createPortal(
    <div className="modal-backdrop history-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`modal metric-history-modal ${metric.tone}`} style={{ "--history-color": color }} role="dialog" aria-modal="true" aria-labelledby="metric-history-title">
        <header className="history-modal-header">
          <div className="history-title-icon" style={{ "--history-color": color }}><Icon name={metric.icon} size={24} /></div>
          <div>
            <span>{t("history.kicker")}</span>
            <h2 id="metric-history-title">{metric.label}</h2>
            <p>{dateLabel} · {deviceId}</p>
          </div>
          <button ref={closeButtonRef} className="icon-button history-close" type="button" onClick={onClose} aria-label={t("history.close")}><X size={20} /></button>
        </header>

        <div className="history-toolbar">
          <button className="history-day-button" type="button" onClick={() => setDayIndex((index) => Math.max(index - 1, 0))} disabled={dayIndex === 0} aria-label={t("history.previousDay")}><ChevronLeft size={18} /></button>
          <div className="history-selected-day"><strong>{isToday ? t("common.today") : dateLabel}</strong><span>{readingWindow}</span></div>
          <button className="history-day-button" type="button" onClick={() => setDayIndex((index) => Math.min(index + 1, days.length - 1))} disabled={dayIndex === days.length - 1} aria-label={t("history.nextDay")}><ChevronRight size={18} /></button>
          <span className={`history-source ${source}`}><i />{source === "live" ? t("history.savedData") : source === "loading" ? t("history.loading") : t("history.previewData")}</span>
        </div>

        <div className="history-chart" style={{ "--history-color": color }}>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={series} margin={{ top: 18, right: 16, left: metric.id === "lightIntensity" ? 0 : -18, bottom: 0 }}>
              <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={color} stopOpacity={0.38} /><stop offset="95%" stopColor={color} stopOpacity={0.02} /></linearGradient></defs>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="hour" interval={2} axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} />
              <YAxis domain={metric.id === "pumpState" ? [0, 1] : ["auto", "auto"]} ticks={metric.id === "pumpState" ? [0, 1] : undefined} tickFormatter={(value) => metric.id === "pumpState" ? (value ? "ON" : "OFF") : value.toLocaleString("en-IN")} axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)" }} formatter={(value) => [formatValue(value, metric), metric.label]} labelFormatter={(label) => `${dateLabel} · ${label}`} />
              <Area type={metric.id === "pumpState" ? "stepAfter" : "monotone"} dataKey="value" stroke={color} strokeWidth={3} fill={`url(#${gradientId})`} activeDot={{ r: 6, fill: color, stroke: "var(--card)", strokeWidth: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={`history-summary ${metric.id === "pumpState" ? "three" : ""}`}>
          {summary.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}
        </div>

        <div className={`history-note ${source === "live" ? "live" : ""}`}><Activity size={16} /><span>{source === "live" ? t("history.liveNote") : t("history.previewNote")}</span></div>
      </section>
    </div>,
    document.body,
  );
}
