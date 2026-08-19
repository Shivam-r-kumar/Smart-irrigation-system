import { AlertTriangle, X } from "lucide-react";

export default function ConfirmationModal({ open, title, message, confirmLabel, cancelLabel, tone = "green", loading, onConfirm, onClose }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="confirmation-title">
        <button className="modal-close icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <div className={`modal-icon ${tone}`}><AlertTriangle /></div>
        <h2 id="confirmation-title">{title}</h2><p>{message}</p>
        <div className="modal-actions"><button className="button secondary" onClick={onClose}>{cancelLabel}</button><button className={`button ${tone === "red" ? "danger" : "primary"}`} onClick={onConfirm} disabled={loading}>{loading ? "…" : confirmLabel}</button></div>
      </section>
    </div>
  );
}
