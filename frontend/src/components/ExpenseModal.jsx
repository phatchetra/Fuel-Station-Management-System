
import { useEffect, useState } from "react";
import { formatKhmerDate, toDateInputValue } from "@/lib/dates";
import { getExpenseAmountKHR } from "@/lib/expenseHelpers";

const EMPTY_FORM = {
  category: "",
  amount: "",
  expenseDate: toDateInputValue(new Date()),
  note: "",
};

export default function ExpenseModal({ open, expense, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const isEdit = Boolean(expense);

  useEffect(() => {
    if (!open) return;

    if (expense) {
      setForm({
        category: expense.category ?? "",
        amount: String(getExpenseAmountKHR(expense) || ""),
        expenseDate: toDateInputValue(expense.expenseDate),
        note: expense.note ?? "",
      });
    } else {
      setForm({ ...EMPTY_FORM, expenseDate: toDateInputValue(new Date()) });
    }
    setError("");
  }, [open, expense]);

  if (!open) return null;

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const result = await onSave(isEdit ? { id: expense.id, ...form } : form);

      if (!result?.ok) {
        setError(result?.error || "មានបញ្ហាក្នុងការរក្សាទុក");
        return;
      }

      onClose();
    } catch (err) {
      setError(err.message || "មានបញ្ហាក្នុងការរក្សាទុក");
    }
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick} role="presentation">
      <div className="modal-panel modal-panel-sm" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 className="modal-title">
            {isEdit ? "កែប្រែចំណាយ" : "បន្ថែមចំណាយ"}
          </h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="បិទ">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="debt-field">
            <label className="debt-field-label" htmlFor="expenseCategory">
              ប្រភេទចំណាយ
            </label>
            <input
              id="expenseCategory"
              className="input input-sm"
              value={form.category}
              onChange={(e) => handleChange("category", e.target.value)}
              placeholder="បញ្ចូលប្រភេទចំណាយ..."
              required
            />
          </div>

          <div className="debt-field">
            <label className="debt-field-label" htmlFor="expenseAmount">
              ចំនួនលុយ (៛)
            </label>
            <input
              id="expenseAmount"
              type="number"
              min="0"
              step="1"
              className="input input-sm tabular-nums"
              value={form.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              placeholder="0"
              required
            />
          </div>

          <div className="debt-field">
            <label className="debt-field-label" htmlFor="expenseDate">
              ថ្ងៃខែឆ្នាំ
            </label>
            <input
              id="expenseDate"
              type="date"
              className="input input-sm"
              value={form.expenseDate}
              onChange={(e) => handleChange("expenseDate", e.target.value)}
              required
            />
            {form.expenseDate && (
              <p className="debt-date-hint">{formatKhmerDate(form.expenseDate)}</p>
            )}
          </div>

          <div className="debt-field">
            <label className="debt-field-label" htmlFor="expenseNote">
              កំណត់ចំណាំ
            </label>
            <input
              id="expenseNote"
              className="input input-sm"
              value={form.note}
              onChange={(e) => handleChange("note", e.target.value)}
              placeholder="ជម្រើស..."
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-dark" onClick={onClose}>
              បោះបង់
            </button>
            <button type="submit" className="btn-gold">
              {isEdit ? "រក្សាទុក" : "បន្ថែម"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
