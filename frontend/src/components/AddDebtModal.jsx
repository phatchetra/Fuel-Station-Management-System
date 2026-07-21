
import { useEffect, useState } from "react";
import { formatKhmerDate, toDateInputValue } from "@/lib/dates";
import { packDebtContact } from "@/lib/debtHelpers";

const EMPTY_FORM = {
  customerName: "",
  phone: "",
  notes: "",
  totalAmount: "",
  debtDate: toDateInputValue(),
};

function DebtField({ label, htmlFor, children, hint }) {
  return (
    <div className="debt-field">
      <label className="debt-field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint}
    </div>
  );
}

export default function AddDebtModal({ open, saving = false, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm({ ...EMPTY_FORM, debtDate: toDateInputValue() });
    setError("");
  }, [open]);

  if (!open) return null;

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handlePhoneChange(value) {
    handleChange("phone", value.replace(/\D/g, ""));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const result = await onSubmit({
      customerName: form.customerName,
      phoneOrNote: packDebtContact(form.phone, form.notes),
      totalAmount: form.totalAmount,
      debtDate: form.debtDate,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onClose();
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick} role="presentation">
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="addDebtModalTitle"
      >
        <div className="modal-header">
          <h2 id="addDebtModalTitle" className="modal-title">
            អ្នកជំពាក់ថ្មី
          </h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="បិទ">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <p className="modal-body-hint">បំពេញព័ត៌មានអតិថិជន រួចចុចកត់ត្រា</p>

          <DebtField label="ឈ្មោះ *" htmlFor="addDebtName">
            <input
              id="addDebtName"
              className="input"
              value={form.customerName}
              disabled={saving}
              onChange={(e) => handleChange("customerName", e.target.value)}
              placeholder="ឈ្មោះអ្នកជំពាក់"
              required
              autoFocus
            />
          </DebtField>

          <DebtField label="លេខទូរស័ព្ទ *" htmlFor="addDebtPhone">
            <input
              id="addDebtPhone"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              className="input tabular-nums en"
              value={form.phone}
              disabled={saving}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="012345678"
              required
            />
          </DebtField>

          <div className="debt-form-grid">
            <DebtField label="ចំនួន (៛) *" htmlFor="addDebtAmount">
              <input
                id="addDebtAmount"
                type="number"
                min="1"
                className="input tabular-nums"
                value={form.totalAmount}
                disabled={saving}
                onChange={(e) => handleChange("totalAmount", e.target.value)}
                placeholder="ឧ. 100000"
                required
              />
            </DebtField>

            <DebtField
              label="ថ្ងៃជំពាក់ *"
              htmlFor="addDebtDate"
              hint={
                <p className="debt-date-hint">
                  {form.debtDate ? formatKhmerDate(form.debtDate) : "ជ្រើសរើសថ្ងៃ"}
                </p>
              }
            >
              <input
                id="addDebtDate"
                type="date"
                className="input"
                value={form.debtDate}
                disabled={saving}
                onChange={(e) => handleChange("debtDate", e.target.value)}
                required
              />
            </DebtField>
          </div>

          <DebtField label="កំណត់ចំណាំ" htmlFor="addDebtNotes">
            <textarea
              id="addDebtNotes"
              className="input modal-textarea"
              value={form.notes}
              disabled={saving}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="ព័ត៌មានបន្ថែម..."
              rows={3}
            />
          </DebtField>

          {error && <p className="error-text">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-dark" onClick={onClose} disabled={saving}>
              បោះបង់
            </button>
            <button type="submit" className="btn-gold" disabled={saving}>
              {saving ? "កំពុងរក្សាទុក..." : "កត់ត្រា"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
