import { useEffect } from "react";
import { createPortal } from "react-dom";
import Reports from "../pages/Reports";

export default function ReportModal({ onClose }) {
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.body.classList.add("modal-open");
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  return createPortal(
    <div className="report-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="report-modal" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
        <Reports embedded onClose={onClose} />
      </section>
    </div>,
    document.body,
  );
}
