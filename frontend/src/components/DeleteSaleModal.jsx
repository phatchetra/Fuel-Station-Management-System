
export default function DeleteSaleModal({
  open,
  mode = "confirm",
  message,
  onConfirm,
  onCancel,
  deleting = false,
}) {
  if (!open) return null;

  const isBlocked = mode === "blocked";

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget && !deleting) onCancel();
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick} role="presentation">
      <div className="modal-panel modal-panel-sm" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 className="modal-title">
            {isBlocked ? "មិនអាចលុបបាន" : "តើអ្នកពិតជាចង់លុបទិន្នន័យនេះមែនទេ?"}
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onCancel}
            disabled={deleting}
            aria-label="បិទ"
          >
            ×
          </button>
        </div>

        <div className="modal-body-text">
          <p>
            {message ||
              (isBlocked
                ? "ទិន្នន័យនេះត្រូវបានបិទបញ្ជីរួចហើយ មិនអាចកែ ឬលុបដោយផ្ទាល់បានទេ"
                : "ការលុបទិន្នន័យនេះនឹងធ្វើអោយសរុបប្រេង និងរបាយការណ៍ត្រូវបានគណនាឡើងវិញ។")}
          </p>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-dark" onClick={onCancel} disabled={deleting}>
            {isBlocked ? "យល់ព្រម" : "បោះបង់"}
          </button>
          {!isBlocked && (
            <button
              type="button"
              className="btn-delete stock-batch-delete-confirm"
              onClick={onConfirm}
              disabled={deleting}
            >
              {deleting ? "កំពុងលុប..." : "យល់ព្រមលុប"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
