/**
 * Status badge — Khmer labels for debtor payment status.
 */
const VARIANTS = {
  UNPAID: {
    label: "មិនទាន់សង",
    className: "bg-red-500/15 text-red-400 border border-red-500/30",
  },
  PARTIAL: {
    label: "សងខ្លះ",
    className: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  },
  PAID: {
    label: "សងរួច",
    className: "bg-green-500/15 text-green-400 border border-green-500/30",
  },
};

export default function StatusBadge({ status }) {
  const config = VARIANTS[status] ?? VARIANTS.UNPAID;

  return (
    <span
      className={`status-badge debt-status-badge ${config.className}`}
    >
      {config.label}
    </span>
  );
}
