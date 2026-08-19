import { ArrowRight, BadgeCheck, Leaf, SlidersHorizontal, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import cropData from "../data/cropRecommendation.json";
import { useLanguage } from "../context/LanguageContext";
import { recommendCrops } from "../utils/cropRecommendation";
import PageHeader from "../components/PageHeader";

const initialValues = Object.fromEntries(cropData.fields.map((field) => [field.id, field.default]));

export default function CropRecommendation() {
  const { t } = useLanguage();
  const [values, setValues] = useState({ ...initialValues, soilType:"Loamy", season:"Rabi", region:"Punjab" });
  const [results, setResults] = useState(() => recommendCrops({ ...initialValues, soilType:"Loamy", season:"Rabi", region:"Punjab" }));
  const best = results[0];
  const detail = useMemo(() => cropData.cropDetails[best.name], [best]);
  const update = (event) => setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = (event) => { event.preventDefault(); setResults(recommendCrops(values)); };

  return (
    <div className="page-stack">
      <PageHeader kicker="SMART CROP PLANNING" title={t(cropData.headingKey)} description={t(cropData.descriptionKey)} />
      <div className="crop-layout">
        <form className="card crop-form" onSubmit={submit}>
          <header className="card-header"><h2><SlidersHorizontal size={19}/>{t("crop.soilInputs")}</h2><span className="required-note">10 agronomic signals</span></header>
          <div className="form-grid">{cropData.fields.map((field) => <label className="form-field" key={field.id}><span>{t(field.labelKey)}</span><div className="input-unit"><input name={field.id} type={field.type} step={field.step} value={values[field.id]} onChange={update} required/><small>{field.unit}</small></div></label>)}</div>
          <div className="form-grid three"><label className="form-field"><span>{t("crop.soilType")}</span><select name="soilType" value={values.soilType} onChange={update}>{cropData.soilTypes.map((option) => <option key={option}>{option}</option>)}</select></label><label className="form-field"><span>{t("crop.season")}</span><select name="season" value={values.season} onChange={update}>{cropData.seasons.map((option) => <option key={option}>{option}</option>)}</select></label><label className="form-field"><span>{t("crop.region")}</span><select name="region" value={values.region} onChange={update}>{cropData.regions.map((option) => <option key={option}>{option}</option>)}</select></label></div>
          <button className="button primary submit-crop" type="submit"><Sparkles size={18}/>{t("crop.suggest")}<ArrowRight size={17}/></button>
        </form>
        <section className="crop-results">
          <article className="card best-crop-card"><span className="result-kicker"><BadgeCheck size={16}/>{t("crop.bestCrop")}</span><div className="best-crop-head"><div className="crop-orb large"><Leaf size={38}/></div><div><h2>{best.name}</h2><p>{t("crop.suitability")}</p></div><strong>{best.score}%</strong></div><div className="score-track"><i style={{ width:`${best.score}%` }}/></div><div className="crop-facts"><div><span>{t("crop.recommendedMoisture")}</span><strong>{detail.moisture}</strong></div><div><span>{t("crop.idealPh")}</span><strong>{detail.ph}</strong></div><div><span>{t("crop.waterRequirement")}</span><strong>{detail.water}</strong></div><div><span>{t("crop.growingSeason")}</span><strong>{detail.season}</strong></div></div><div className="why-crop"><h3>{t("crop.why")} {best.name}?</h3><p>{t("crop.explanation")}</p></div></article>
          <article className="card other-crops"><header className="card-header"><h2>{t("crop.otherSuitable")}</h2></header>{results.slice(1).map((crop) => <div className="other-crop-row" key={crop.name}><div className="mini-crop"><Leaf size={17}/></div><div><strong>{crop.name}</strong><span className="score-track"><i style={{ width:`${crop.score}%` }}/></span></div><b>{crop.score}%</b></div>)}</article>
        </section>
      </div>
    </div>
  );
}
