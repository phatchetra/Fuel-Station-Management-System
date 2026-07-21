
export default function StockBatchDeleteModal({
  open,
  mode = "confirm",
  title,
  message,
  onConfirm,
  onCancel,
  deleting = false,
}) {
  if (!open) return null;

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget && !deleting) onCancel();
  }

  const isBlocked = mode === "blocked";

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick} role="presentation">
      <div
        className="modal-panel modal-panel-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stockBatchDeleteTitle"
      >
        <div className="modal-header">
          <h2 id="stockBatchDeleteTitle" className="modal-title">
            {title ||
              (isBlocked
                ? "មិនអាចលុបបាន"
                : "តើអ្នកពិតជាចង់លុបស្តុកចូលនេះមែនទេ?")}
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
                ? "មិនអាចលុបបានទេ ព្រោះស្តុកនេះមានការប្រើប្រាស់រួចហើយ។ សូមប្រើការកែតម្រូវជំនួសវិញ។"
                : "សកម្មភាពនេះនឹងលុបប្រវត្តិស្តុកចូលនេះ ហើយស្តុកបច្ចុប្បន្ននឹងត្រូវបានគណនាឡើងវិញ។")}
          </p>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn-dark"
            onClick={onCancel}
            disabled={deleting}
          >
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
