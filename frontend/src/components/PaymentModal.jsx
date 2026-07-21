
import { useEffect, useState } from "react";
import { formatKHR } from "@/lib/formatters";

const EMPTY_FORM = {
  amount: "",
};

export default function PaymentModal({ debt, presetAmount, saving = false, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!debt) return;
    setForm({
      amount: presetAmount != null ? String(presetAmount) : "",
    });
    setError("");
  }, [debt, presetAmount]);

  if (!debt) return null;

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const amount = Number(form.amount);
    if (!form.amount.trim() || !amount || amount <= 0) {
      setError("សូមបញ្ចូលចំនួនលុយសងធំជាង 0");
      return;
    }

    const result = await onSave(debt.id, { amount: form.amount });
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
      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="paymentModalTitle">
        <div className="modal-header">
          <h2 id="paymentModalTitle" className="modal-title">
            សងបំណុល
          </h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="បិទ">
            ×
          </button>
        </div>

        <div className="modal-debt-summary">
          <p className="modal-debt-name">{debt.customerName}</p>
          <div className="modal-summary-grid">
            <div>
              <span className="modal-summary-label">សរុបជំពាក់</span>
              <span className="modal-summary-value tabular-nums">{formatKHR(debt.totalAmount)}</span>
            </div>
            <div>
              <span className="modal-summary-label">បានសង</span>
              <span className="modal-summary-value tabular-nums text-[var(--green)]">
                {formatKHR(debt.paidAmount)}
              </span>
            </div>
            <div>
              <span className="modal-summary-label">នៅជំពាក់</span>
              <span className="modal-summary-value tabular-nums text-[var(--red)]">
                {formatKHR(debt.remainingAmount)}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="debt-field">
            <label className="debt-field-label" htmlFor="payAmount">
              ចំនួនលុយសង
            </label>
            <input
              id="payAmount"
              type="number"
              min="0"
              className="input input-sm tabular-nums"
              placeholder="បញ្ចូលចំនួនលុយដែលបានសង"
              value={form.amount}
              disabled={saving}
              onChange={(e) => handleChange("amount", e.target.value)}
              autoFocus
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-dark" onClick={onClose} disabled={saving}>
              បោះបង់
            </button>
            <button type="submit" className="btn-gold" disabled={saving}>
              {saving ? "កំពុងរក្សាទុក..." : "រក្សាទុកការសងប្រាក់"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
