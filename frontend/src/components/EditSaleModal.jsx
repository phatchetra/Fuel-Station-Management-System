
import { useEffect, useState } from "react";
import { formatKhmerDate, toDateInputValue } from "@/lib/dates";

export default function EditSaleModal({
  open,
  sale,
  fuels,
  sessionStartAt,
  onClose,
  onSave,
  onCorrect,
}) {
  const [form, setForm] = useState({
    fuelTypeId: "",
    liters: "",
    pricePerLiter: "",
    saleDate: "",
    note: "",
    reason: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const isCorrection = Boolean(sale && !sale.canEdit && sale.canCorrect);

  useEffect(() => {
    if (!open || !sale) return;

    setForm({
      fuelTypeId: String(sale.fuelTypeId ?? sale.fuelType?.id ?? ""),
      liters: String(sale.liters ?? ""),
      pricePerLiter: String(sale.pricePerLiter ?? ""),
      saleDate: toDateInputValue(sale.saleDate),
      note: sale.note ?? "",
      reason: "",
    });
    setError("");
  }, [open, sale]);

  if (!open || !sale) return null;

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const payload = {
        fuelTypeId: Number(form.fuelTypeId),
        liters: Number(form.liters),
        pricePerLiter: Number(form.pricePerLiter),
        saleDate: form.saleDate,
        note: form.note,
      };

      const handler = isCorrection ? onCorrect : onSave;
      const result = await handler(sale.id, {
        ...payload,
        reason: isCorrection ? form.reason : undefined,
      });

      if (!result?.ok) {
        setError(result?.error || "មានបញ្ហាក្នុងការរក្សាទុក");
        return;
      }

      onClose(result.message);
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
          <h2 className="modal-title">
            {isCorrection ? "កែតម្រូវកំណត់ត្រាលក់" : "កែប្រែកំណត់ត្រាលក់"}
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={() => onClose()}
            disabled={saving}
            aria-label="បិទ"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {isCorrection && (
            <div className="stock-batch-warning-box" role="alert">
              <p>
                ទិន្នន័យនេះនៅក្នុងរបាយការណ៍បិទបញ្ជីរួចហើយ។ ការកែតម្រូវនឹងត្រូវបានកត់ត្រាជាប្រវត្តិ
                ដោយមិនផ្លាស់ប្តូរទិន្នន័យដើមដោយផ្ទាល់។
              </p>
            </div>
          )}

          <div className="debt-field">
            <label className="debt-field-label" htmlFor="saleFuelType">
              ប្រភេទប្រេង
            </label>
            <select
              id="saleFuelType"
              className="input input-sm"
              value={form.fuelTypeId}
              onChange={(e) => handleChange("fuelTypeId", e.target.value)}
              required
            >
              {fuels.map((fuel) => (
                <option key={fuel.id} value={fuel.id}>
                  {fuel.nameKhmer}
                </option>
              ))}
            </select>
          </div>

          <div className="debt-field">
            <label className="debt-field-label" htmlFor="saleLiters">
              ចំនួនលីត្រ
            </label>
            <input
              id="saleLiters"
              type="number"
              min="0"
              step="0.01"
              className="input input-sm tabular-nums"
              value={form.liters}
              onChange={(e) => handleChange("liters", e.target.value)}
              required
            />
          </div>

          <div className="debt-field">
            <label className="debt-field-label" htmlFor="salePrice">
              តម្លៃក្នុងមួយលីត្រ (៛)
            </label>
            <input
              id="salePrice"
              type="number"
              min="0"
              step="1"
              className="input input-sm tabular-nums"
              value={form.pricePerLiter}
              onChange={(e) => handleChange("pricePerLiter", e.target.value)}
              required
            />
          </div>

          <div className="debt-field">
            <label className="debt-field-label" htmlFor="saleDate">
              ថ្ងៃខែឆ្នាំ
            </label>
            <input
              id="saleDate"
              type="date"
              className="input input-sm"
              value={form.saleDate}
              min={sessionStartAt ? toDateInputValue(sessionStartAt) : undefined}
              onChange={(e) => handleChange("saleDate", e.target.value)}
              required
              disabled={isCorrection}
            />
            {form.saleDate && (
              <p className="debt-date-hint">{formatKhmerDate(form.saleDate)}</p>
            )}
          </div>

          <div className="debt-field">
            <label className="debt-field-label" htmlFor="saleNote">
              កំណត់ចំណាំ
            </label>
            <input
              id="saleNote"
              className="input input-sm"
              value={form.note}
              onChange={(e) => handleChange("note", e.target.value)}
              placeholder="ជម្រើស..."
            />
          </div>

          {isCorrection && (
            <div className="debt-field">
              <label className="debt-field-label" htmlFor="saleReason">
                មូលហេតុកែតម្រូវ
              </label>
              <input
                id="saleReason"
                className="input input-sm"
                value={form.reason}
                onChange={(e) => handleChange("reason", e.target.value)}
                placeholder="ពិពណ៌នាកំហុស..."
                required
              />
            </div>
          )}

          {error && <p className="error-text">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-dark" onClick={() => onClose()} disabled={saving}>
              បោះបង់
            </button>
            <button type="submit" className="btn-gold" disabled={saving}>
              {saving ? "កំពុងរក្សាទុក..." : isCorrection ? "កត់ត្រាកែតម្រូវ" : "រក្សាទុក"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
