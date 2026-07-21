
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "យល់ព្រម",
  cancelLabel = "បោះបង់",
  onConfirm,
  onCancel,
  loading = false,
  confirmClassName = "btn-gold",
}) {
  if (!open) return null;

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget && !loading) onCancel();
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick} role="presentation">
      <div
        className="modal-panel modal-panel-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmModalTitle"
      >
        <div className="modal-header">
          <h2 id="confirmModalTitle" className="modal-title">
            {title}
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onCancel}
            disabled={loading}
            aria-label="បិទ"
          >
            ×
          </button>
        </div>

        {message && (
          <div className="modal-body-text">
            <p>{message}</p>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-dark" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={confirmClassName}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "កំពុងដំណើរការ..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
