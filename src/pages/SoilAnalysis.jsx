import { useState } from "react";
import { CheckCircle2, ExternalLink, FileCheck2, FlaskConical, Lightbulb, RotateCcw, Trash2, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import soilData from "../data/soilAnalysis.json";
import { useLanguage } from "../context/LanguageContext";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import ChartCard from "../components/ChartCard";
import SoilReportUploadModal, { formatFileSize } from "../components/SoilReportUploadModal";

export default function SoilAnalysis() {
  const { t } = useLanguage();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const previewReport = () => {
    if (!selectedReport?.file) return;
    const previewUrl = URL.createObjectURL(selectedReport.file);
    window.open(previewUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(previewUrl), 60_000);
  };

  return (
    <div className="page-stack">
      <PageHeader kicker="FIELD A · SOIL LAB" title={t(soilData.headingKey)} description={t(soilData.descriptionKey)} actions={<button className={`button primary soil-upload-trigger${selectedReport ? " has-file" : ""}`} type="button" onClick={() => setUploadOpen(true)}>{selectedReport ? <FileCheck2 size={17} /> : <FlaskConical size={17} />}{selectedReport ? t("soil.uploadReplace") : t("soil.upload")}</button>} />
      {selectedReport && (
        <section className="card soil-report-strip" aria-label={t("soil.uploadSelected")}>
          <span className="soil-report-strip-icon"><FileCheck2 size={22} /></span>
          <div>
            <span>{t("soil.uploadSelected")}</span>
            <strong title={selectedReport.file.name}>{selectedReport.file.name}</strong>
            <small>{formatFileSize(selectedReport.file.size)} · {t("soil.uploadSession")}</small>
          </div>
          <div className="soil-report-strip-actions">
            <button className="button secondary small" type="button" onClick={previewReport}><ExternalLink size={14} />{t("soil.uploadPreview")}</button>
            <button className="button ghost small" type="button" onClick={() => setUploadOpen(true)}><RotateCcw size={14} />{t("soil.uploadReplace")}</button>
            <button className="icon-button soil-report-remove" type="button" onClick={() => setSelectedReport(null)} aria-label={t("soil.uploadRemove")} title={t("soil.uploadRemove")}><Trash2 size={16} /></button>
          </div>
        </section>
      )}
      <div className="soil-overview-grid">
        <section className="card health-card"><div className="health-ring" style={{ "--score": `${soilData.healthScore * 3.6}deg` }}><div><strong>{soilData.healthScore}</strong><span>/ 100</span></div></div><div><span>{t("soil.overallHealth")}</span><h2>{t("status.good")}</h2><p>{t("soil.sample")}: {soilData.sample}</p><StatusBadge tone="success" dot>{t("status.healthy")}</StatusBadge></div></section>
        <ChartCard title={t("soil.trend")} className="soil-trend">
          <ResponsiveContainer width="100%" height={210}><AreaChart data={soilData.history} margin={{ top: 8, right: 10, left: -25, bottom: 0 }}><defs><linearGradient id="healthFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#269b55" stopOpacity={0.32}/><stop offset="95%" stopColor="#269b55" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="var(--chart-grid)" vertical={false}/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill:"var(--muted)", fontSize:11 }}/><YAxis domain={[50,100]} axisLine={false} tickLine={false} tick={{ fill:"var(--muted)", fontSize:11 }}/><Tooltip contentStyle={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:10 }}/><Area type="monotone" dataKey="health" stroke="#269b55" strokeWidth={3} fill="url(#healthFill)"/></AreaChart></ResponsiveContainer>
        </ChartCard>
      </div>
      <section><div className="section-title"><div><span className="eyebrow">LATEST LAB VALUES</span><h2>{t("soil.nutrientProfile")}</h2></div></div><div className="soil-parameter-grid">{soilData.parameters.map((item) => <article className={`card parameter-card ${item.tone}`} key={item.id}><header><span>{t(item.labelKey)}</span><StatusBadge tone={item.score < 55 ? "warning" : "success"}>{t(item.statusKey)}</StatusBadge></header><div className="parameter-value"><strong>{item.value}</strong><small>{item.unit}</small></div><span className="progress-track"><i style={{ width:`${item.score}%` }}/></span><p>{item.score}% of the agronomic target</p></article>)}</div></section>
      <section className="card recommendation-card"><header className="card-header"><h2><Lightbulb size={20}/>{t("soil.recommendations")}</h2><StatusBadge tone="info"><TrendingUp size={13}/> 3 actions</StatusBadge></header><div className="recommendation-list">{soilData.recommendations.map((key, index) => <div key={key}><CheckCircle2 size={19}/><span><b>0{index + 1}</b>{t(key)}</span></div>)}</div></section>
      <SoilReportUploadModal open={uploadOpen} initialFile={selectedReport?.file} onClose={() => setUploadOpen(false)} onConfirm={(file) => setSelectedReport({ file, selectedAt: new Date() })} t={t} />
    </div>
  );
}
