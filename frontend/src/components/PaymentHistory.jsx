
import { useState } from "react";
import { formatKhmerKHR } from "@/lib/formatters";
import { formatKhmerDate } from "@/lib/dates";
import { sortPaymentsNewestFirst } from "@/lib/debtHelpers";

export default function PaymentHistory({ payments = [], defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen && payments.length > 0);

  if (!payments.length) return null;

  const sorted = sortPaymentsNewestFirst(payments);

  return (
    <div className="payment-history">
      <button
        type="button"
        className="payment-history-toggle"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="payment-history-title">ប្រវត្តិសងប្រាក់</span>
        <span className="payment-history-count">{sorted.length}</span>
        <svg
          className={`payment-history-chevron ${open ? "payment-history-chevron-open" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul className="payment-history-list">
          {sorted.map((payment) => (
            <li key={payment.id} className="payment-history-item">
              <p className="payment-history-line">
                សង {formatKhmerKHR(payment.amount)} នៅ
                {formatKhmerDate(payment.paymentDate)}
              </p>
              {payment.note?.trim() && (
                <p className="payment-history-note">{payment.note.trim()}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
