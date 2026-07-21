
import { useEffect, useState } from "react";
import { formatKhmerDate, toDateInputValue } from "@/lib/dates";

export default function StockBatchEditModal({
  open,
  batch,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    originalLiters: "",
    receivedAt: "",
    note: "",
  });
  const [confirmUsedEdit, setConfirmUsedEdit] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !batch) return;

    setForm({
      originalLiters: String(batch.originalLiters ?? ""),
      receivedAt: toDateInputValue(batch.receivedAt),
      note: batch.note ?? "",
    });
    setConfirmUsedEdit(false);
    setError("");
  }, [open, batch]);

  if (!open || !batch) return null;

  const pricePerLiter = batch.fuelType?.pricePerLiter ?? 0;
  const showUsedWarning = batch.editRequiresWarning;

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (showUsedWarning && !confirmUsedEdit) {
      setError("សូមធីកប្រអប់បញ្ជាក់មុនកែប្រែស្តុកដែលបានប្រើរួច");
      return;
    }

    setSaving(true);
    try {
      const result = await onSave(batch.id, {
        originalLiters: Number(form.originalLiters),
        receivedAt: form.receivedAt,
        note: form.note,
        confirmUsedEdit: showUsedWarning ? true : undefined,
      });

      if (!result?.ok) {
        setError(result?.error || "មានបញ្ហាក្នុងការរក្សាទុក");
        return;
      }

      onClose();
    } catch (err) {
      setError(err.message || "មានបញ្ហាក្នុងការរក្សាទុក");
    } finally {
      setSaving(false);
    }
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget && !saving) onClose();
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick} role="presentation">
      <div className="modal-panel modal-panel-sm" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 className="modal-title">កែប្រែស្តុកចូល</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={saving}
            aria-label="បិទ"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <p className="modal-body-hint">
            {batch.fuelType?.nameKhmer} — លក់រួច {batch.soldLiters?.toLocaleString("en-US")}L
          </p>

          {showUsedWarning && (
            <div className="stock-batch-warning-box" role="alert">
              <p>
                ស្តុកនេះមានការប្រើប្រាស់រួចហើយ។ ការកែប្រែនឹងគណនាស្តុកបច្ចុប្បន្នឡើងវិញ។
              </p>
              <label className="stock-batch-warning-check">
                <input
                  type="checkbox"
                  checked={confirmUsedEdit}
                  onChange={(e) => setConfirmUsedEdit(e.target.checked)}
                />
                ខ្ញុំយល់ព្រម និងចង់កែប្រែ
              </label>
            </div>
          )}

          <div className="debt-field">
            <label className="debt-field-label" htmlFor="batchLiters">
              ចំនួនលីត្របញ្ចូល
            </label>
            <input
              id="batchLiters"
              type="number"
              min="0"
              step="0.01"
              className="input input-sm tabular-nums"
              value={form.originalLiters}
              onChange={(e) => handleChange("originalLiters", e.target.value)}
              required
            />
          </div>

          <div className="debt-field">
            <label className="debt-field-label" htmlFor="batchPrice">
              តម្លៃក្នុងមួយលីត្រ (៛)
            </label>
            <input
              id="batchPrice"
              type="number"
              className="input input-sm tabular-nums"
              value={pricePerLiter}
              readOnly
              disabled
            />
            <p className="debt-date-hint">តម្លៃនេះជាតម្លៃប្រេងបច្ចុប្បន្ន — កែនៅកាតប្រេង</p>
          </div>

          <div className="debt-field">
            <label className="debt-field-label" htmlFor="batchDate">
              ថ្ងៃខែឆ្នាំ
            </label>
            <input
              id="batchDate"
              type="date"
              className="input input-sm"
              value={form.receivedAt}
              onChange={(e) => handleChange("receivedAt", e.target.value)}
              required
            />
            {form.receivedAt && (
              <p className="debt-date-hint">{formatKhmerDate(form.receivedAt)}</p>
            )}
          </div>

          <div className="debt-field">
            <label className="debt-field-label" htmlFor="batchNote">
              កំណត់ចំណាំ
            </label>
            <input
              id="batchNote"
              className="input input-sm"
              value={form.note}
              onChange={(e) => handleChange("note", e.target.value)}
              placeholder="ជម្រើស..."
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-dark" onClick={onClose} disabled={saving}>
              បោះបង់
            </button>
            <button type="submit" className="btn-gold" disabled={saving}>
              {saving ? "កំពុងរក្សាទុក..." : "រក្សាទុក"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
