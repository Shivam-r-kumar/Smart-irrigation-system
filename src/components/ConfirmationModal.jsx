import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmationModal({ open, title, message, confirmLabel, cancelLabel, tone = "green", loading, onConfirm, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.classList.remove("modal-open");
    };
  }, [loading, onClose, open]);

  if (!open) return null;
  return createPortal((
    <div className="modal-backdrop confirmation-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !loading && onClose()}>
      <section className="modal confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="confirmation-title">
        <button className="modal-close icon-button" type="button" onClick={onClose} disabled={loading} aria-label="Close" autoFocus><X size={18} /></button>
        <div className={`modal-icon ${tone}`}><AlertTriangle /></div>
        <h2 id="confirmation-title">{title}</h2><p>{message}</p>
        <div className="modal-actions"><button className="button secondary" type="button" onClick={onClose} disabled={loading}>{cancelLabel}</button><button className={`button ${tone === "red" ? "danger" : "primary"}`} type="button" onClick={onConfirm} disabled={loading}>{loading ? "…" : confirmLabel}</button></div>
      </section>
    </div>
  ), document.body);
}
