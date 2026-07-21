
import { formatKhmerDate } from "@/lib/dates";

export default function CloseDayModal({ open, onConfirm, onCancel, closing = false }) {
  if (!open) return null;

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) onCancel();
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick} role="presentation">
      <div
        className="modal-panel modal-panel-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="closeDayTitle"
      >
        <div className="modal-header">
          <h2 id="closeDayTitle" className="modal-title">
            បិទបញ្ជីថ្ងៃនេះ?
          </h2>
          <button type="button" className="modal-close" onClick={onCancel} aria-label="បិទ">
            ×
          </button>
        </div>

        <div className="modal-body-text">
          <p>
            សូមពិនិត្យទិន្នន័យអោយបានត្រឹមត្រូវ មុនពេលបិទបញ្ជី។ ទិន្នន័យថ្ងៃនេះនឹងត្រូវរក្សាទុកក្នុងរបាយការណ៍។
          </p>
          <p className="modal-body-hint">ថ្ងៃនេះ: {formatKhmerDate(new Date())}</p>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-dark" onClick={onCancel} disabled={closing}>
            បោះបង់
          </button>
          <button type="button" className="btn-gold" onClick={onConfirm} disabled={closing}>
            {closing ? "កំពុងបិទ..." : "យល់ព្រមបិទបញ្ជី"}
          </button>
        </div>
      </div>
    </div>
  );
}
