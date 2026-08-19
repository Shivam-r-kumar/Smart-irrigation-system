import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, ExternalLink, FileText, RotateCcw, UploadCloud, X } from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdf(file) {
  return file?.type === "application/pdf" || file?.name?.toLowerCase().endsWith(".pdf");
}

export default function SoilReportUploadModal({ open, initialFile, onClose, onConfirm, t }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    setFile(initialFile || null);
    setError("");
    setDragging(false);
  }, [initialFile, open]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return undefined;
    }

    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const acceptFile = (nextFile) => {
    if (!nextFile) return;
    if (!isPdf(nextFile)) {
      setFile(null);
      setError(t("soil.uploadInvalid"));
      return;
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setError(t("soil.uploadTooLarge"));
      return;
    }
    setFile(nextFile);
    setError("");
  };

  const openPicker = () => inputRef.current?.click();

  return createPortal(
    <div className="soil-upload-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="soil-upload-modal" role="dialog" aria-modal="true" aria-labelledby="soil-upload-title">
        <header className="soil-upload-header">
          <div className="soil-upload-title-icon"><FileText size={22} /></div>
          <div>
            <span className="eyebrow">PDF SOIL REPORT</span>
            <h2 id="soil-upload-title">{t("soil.uploadTitle")}</h2>
            <p>{t("soil.uploadDescription")}</p>
          </div>
          <button className="icon-button soil-upload-close" type="button" onClick={onClose} aria-label={t("soil.uploadClose")} autoFocus><X size={18} /></button>
        </header>

        <div className="soil-upload-body">
          <input
            ref={inputRef}
            className="visually-hidden"
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => {
              acceptFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />

          {!file ? (
            <div
              className={`soil-upload-dropzone${dragging ? " is-dragging" : ""}${error ? " has-error" : ""}`}
              role="button"
              tabIndex={0}
              onClick={openPicker}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openPicker();
                }
              }}
              onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                acceptFile(event.dataTransfer.files?.[0]);
              }}
            >
              <span className="soil-upload-cloud"><UploadCloud size={28} /></span>
              <strong>{t("soil.uploadDrop")}</strong>
              <span>{t("soil.uploadBrowse")}</span>
              <small>{t("soil.uploadRules")}</small>
            </div>
          ) : (
            <div className="soil-upload-selected">
              <div className="soil-upload-file-icon"><FileText size={30} /></div>
              <div className="soil-upload-file-copy">
                <span><CheckCircle2 size={14} />{t("soil.uploadReady")}</span>
                <strong title={file.name}>{file.name}</strong>
                <small>{formatFileSize(file.size)} · PDF</small>
              </div>
              <div className="soil-upload-file-actions">
                <a className="button secondary small" href={previewUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} />{t("soil.uploadPreview")}</a>
                <button className="button ghost small" type="button" onClick={openPicker}><RotateCcw size={14} />{t("soil.uploadReplace")}</button>
              </div>
            </div>
          )}

          {error && <p className="soil-upload-error" role="alert">{error}</p>}
          <div className="soil-upload-note">
            <CheckCircle2 size={16} />
            <span><strong>{t("soil.uploadLocalTitle")}</strong>{t("soil.uploadLocalNote")}</span>
          </div>
        </div>

        <footer className="soil-upload-footer">
          <button className="button secondary" type="button" onClick={onClose}>{t("common.cancel")}</button>
          <button className="button primary" type="button" disabled={!file} onClick={() => { onConfirm(file); onClose(); }}><CheckCircle2 size={16} />{t("soil.uploadUse")}</button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
