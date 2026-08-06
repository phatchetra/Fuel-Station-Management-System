
import { useState } from "react";
import CollapsibleSection from "./CollapsibleSection";
import EmptyState from "./EmptyState";
import StockBatchEditModal from "./StockBatchEditModal";
import StockBatchDeleteModal from "./StockBatchDeleteModal";
import { formatKhmerLiters } from "@/lib/formatters";
import { formatKhmerDate, formatKhmerDateCompact } from "@/lib/dates";

const FUEL_CHIP = {
  green: "report-chip-green",
  blue: "report-chip-blue",
  red: "report-chip-red",
};

function BatchStatusBadge({ status, statusLabel }) {
  const isActive = status === "ACTIVE";
  return (
    <span className={`stock-batch-status ${isActive ? "is-active" : "is-depleted"}`}>
      {statusLabel}
    </span>
  );
}

function BatchProgress({ percent }) {
  return (
    <div
      className="stock-batch-progress"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="stock-batch-progress-fill"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function BatchActions({ batch, onEdit, onDelete }) {
  return (
    <div className="stock-batch-actions">
      <button
        type="button"
        className="btn-ghost-sm"
        onClick={() => onEdit(batch)}
        title={batch.editBlockReason || undefined}
      >
        កែប្រែ
      </button>
      <button
        type="button"
        className="btn-delete history-delete-btn"
        onClick={() => onDelete(batch)}
        title={batch.deleteBlockReason || undefined}
      >
        លុប
      </button>
    </div>
  );
}

export default function StockBatchesSection({
  stockBatches,
  loading,
  onUpdateBatch,
  onDeleteBatch,
}) {
  const [editBatch, setEditBatch] = useState(null);
  const [deleteBatch, setDeleteBatch] = useState(null);
  const [deleteMode, setDeleteMode] = useState("confirm");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deleting, setDeleting] = useState(false);

  function handleEditClick(batch) {
    if (!batch.canEdit) {
      if (batch.editBlockReason) {
        setDeleteMode("blocked");
        setDeleteMessage(batch.editBlockReason);
        setDeleteBatch({ ...batch, _warningTitle: "មិនអាចកែប្រែបាន" });
      }
      return;
    }
    setEditBatch(batch);
  }

  function handleDeleteClick(batch) {
    if (batch.canDelete) {
      setDeleteMode("confirm");
      setDeleteMessage(
        batch.fullyDepleted
          ? "ប្រវត្តិស្តុកលក់អស់នេះនឹងត្រូវបានលុបចេញពីបញ្ជី។ ស្តុកបច្ចុប្បន្នមិនប្រែទេ។"
          : "សកម្មភាពនេះនឹងលុបប្រវត្តិស្តុកចូលនេះ ហើយស្តុកបច្ចុប្បន្ននឹងត្រូវបានគណនាឡើងវិញ។"
      );
      setDeleteBatch(batch);
      return;
    }

    setDeleteMode("blocked");
    setDeleteMessage(batch.deleteBlockReason || "");
    setDeleteBatch(batch);
  }

  async function handleConfirmDelete() {
    if (!deleteBatch || deleteMode !== "confirm") return;

    setDeleting(true);
    try {
      const result = await onDeleteBatch(deleteBatch.id);
      if (!result?.ok) {
        setDeleteMode("blocked");
        setDeleteMessage(result?.error || "មិនអាចលុបបាន");
        return;
      }
      setDeleteBatch(null);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <CollapsibleSection title="ប្រវត្តិស្តុកចូល" defaultOpen>
        <p className="stock-batches-empty">កំពុងផ្ទុកទិន្នន័យស្តុក...</p>
      </CollapsibleSection>
    );
  }

  return (
    <>
      <CollapsibleSection title="ប្រវត្តិស្តុកចូល" defaultOpen>
        {stockBatches.length === 0 ? (
          <EmptyState message="មិនទាន់មានប្រវត្តិស្តុកចូល" />
        ) : (
          <>
            {/* Desktop / tablet table */}
            <div className="stock-batches-table-wrap stock-batches-desktop">
              <table className="stock-batches-table">
                <thead>
                  <tr>
                    <th>ប្រភេទប្រេង</th>
                    <th>ថ្ងៃស្តុកចូល</th>
                    <th>ចំនួនដើម</th>
                    <th>លក់រួច</th>
                    <th>នៅសល់</th>
                    <th>ស្ថានភាព</th>
                    <th>លក់អស់នៅថ្ងៃ</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {stockBatches.map((batch) => {
                    const chipClass =
                      FUEL_CHIP[batch.fuelType?.accentColor] ?? FUEL_CHIP.green;

                    return (
                      <tr key={batch.id}>
                        <td>
                          <span className={`report-chip ${chipClass}`}>
                            {batch.fuelType?.nameKhmer ?? "—"}
                          </span>
                          {batch.note && (
                            <p className="stock-batch-note">{batch.note}</p>
                          )}
                        </td>
                        <td>{formatKhmerDate(batch.receivedAt)}</td>
                        <td className="tabular-nums en">
                          {formatKhmerLiters(batch.originalLiters)}
                        </td>
                        <td className="tabular-nums en">
                          {formatKhmerLiters(batch.soldLiters)}
                        </td>
                        <td className="tabular-nums en">
                          {formatKhmerLiters(batch.remainingLiters)}
                        </td>
                        <td>
                          <BatchStatusBadge
                            status={batch.status}
                            statusLabel={batch.statusLabel}
                          />
                          <BatchProgress percent={batch.progressPercent} />
                        </td>
                        <td>
                          {batch.depletedAt ? formatKhmerDate(batch.depletedAt) : "—"}
                        </td>
                        <td>
                          <BatchActions
                            batch={batch}
                            onEdit={handleEditClick}
                            onDelete={handleDeleteClick}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked cards — no horizontal scroll */}
            <div className="stock-batches-cards stock-batches-mobile">
              {stockBatches.map((batch) => {
                const chipClass =
                  FUEL_CHIP[batch.fuelType?.accentColor] ?? FUEL_CHIP.green;

                return (
                  <article key={batch.id} className="stock-batch-card">
                    <div className="stock-batch-card-top">
                      <span className={`report-chip ${chipClass}`}>
                        {batch.fuelType?.nameKhmer ?? "—"}
                      </span>
                      <BatchStatusBadge
                        status={batch.status}
                        statusLabel={batch.statusLabel}
                      />
                    </div>

                    <p className="stock-batch-card-date">
                      {formatKhmerDateCompact(batch.receivedAt)}
                    </p>

                    <div className="stock-batch-card-stats">
                      <div className="stock-batch-card-stat">
                        <span className="stock-batch-card-stat-label">ដើម</span>
                        <span className="stock-batch-card-stat-value tabular-nums en">
                          {formatKhmerLiters(batch.originalLiters)}
                        </span>
                      </div>
                      <div className="stock-batch-card-stat">
                        <span className="stock-batch-card-stat-label">លក់រួច</span>
                        <span className="stock-batch-card-stat-value tabular-nums en">
                          {formatKhmerLiters(batch.soldLiters)}
                        </span>
                      </div>
                      <div className="stock-batch-card-stat">
                        <span className="stock-batch-card-stat-label">នៅសល់</span>
                        <span className="stock-batch-card-stat-value tabular-nums en">
                          {formatKhmerLiters(batch.remainingLiters)}
                        </span>
                      </div>
                    </div>

                    <BatchProgress percent={batch.progressPercent} />

                    {batch.depletedAt && (
                      <p className="stock-batch-card-meta">
                        លក់អស់: {formatKhmerDateCompact(batch.depletedAt)}
                      </p>
                    )}

                    {batch.note && (
                      <p className="stock-batch-note">{batch.note}</p>
                    )}

                    <BatchActions
                      batch={batch}
                      onEdit={handleEditClick}
                      onDelete={handleDeleteClick}
                    />
                  </article>
                );
              })}
            </div>
          </>
        )}
      </CollapsibleSection>

      <StockBatchEditModal
        open={Boolean(editBatch)}
        batch={editBatch}
        onClose={() => setEditBatch(null)}
        onSave={onUpdateBatch}
      />

      <StockBatchDeleteModal
        open={Boolean(deleteBatch)}
        mode={deleteMode}
        title={deleteBatch?._warningTitle}
        message={deleteMessage}
        deleting={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => !deleting && setDeleteBatch(null)}
      />
    </>
  );
}
