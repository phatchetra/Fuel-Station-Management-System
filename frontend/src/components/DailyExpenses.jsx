
import { useState } from "react";
import ExpenseModal from "./ExpenseModal";
import { formatKHR } from "@/lib/formatters";
import { formatKhmerDate } from "@/lib/dates";
import { formatExpenseAmount, getExpenseCategoryLabel } from "@/lib/expenseHelpers";

export default function DailyExpenses({
  expenses,
  totalExpenses,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  function handleOpenAdd() {
    setEditingExpense(null);
    setModalOpen(true);
  }

  function handleOpenEdit(expense) {
    setEditingExpense(expense);
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setEditingExpense(null);
  }

  function handleSave(data) {
    if (data.id) {
      return onUpdateExpense(data.id, data);
    }
    return onAddExpense(data);
  }

  async function handleDelete(expense) {
    if (
      !window.confirm(
        `តើអ្នកពិតជាចង់លុបចំណាយ "${getExpenseCategoryLabel(expense.category)}"?`
      )
    ) {
      return;
    }

    const result = await onDeleteExpense(expense.id);
    if (!result?.ok) {
      window.alert(result?.error || "មិនអាចលុបចំណាយបាន");
    }
  }

  return (
    <>
      <section className="daily-expenses">
        <div className="daily-expenses-header">
          <h3 className="daily-expenses-title">ចំណាយផ្សេងៗ</h3>
          <button type="button" className="btn-gold daily-expenses-add-btn" onClick={handleOpenAdd}>
            បន្ថែមចំណាយ
          </button>
        </div>

        {expenses.length === 0 ? (
          <p className="daily-expenses-empty">មិនមានចំណាយផ្សេងៗ</p>
        ) : (
          <div className="daily-expenses-table-wrap">
            <table className="daily-expenses-table">
              <thead>
                <tr>
                  <th>ប្រភេទចំណាយ</th>
                  <th>ចំនួនលុយ</th>
                  <th>ថ្ងៃខែឆ្នាំ</th>
                  <th>កំណត់ចំណាំ</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{getExpenseCategoryLabel(expense.category)}</td>
                    <td className="tabular-nums daily-expenses-amount">
                      {formatExpenseAmount(expense)}
                    </td>
                    <td>{formatKhmerDate(expense.expenseDate)}</td>
                    <td className="daily-expenses-note">{expense.note?.trim() || "—"}</td>
                    <td>
                      <div className="daily-expenses-actions">
                        <button
                          type="button"
                          className="btn-ghost-sm"
                          onClick={() => handleOpenEdit(expense)}
                        >
                          កែប្រែ
                        </button>
                        <button
                          type="button"
                          className="btn-delete history-delete-btn"
                          onClick={() => handleDelete(expense)}
                        >
                          លុប
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="daily-expenses-total tabular-nums">
          ចំណាយផ្សេងៗសរុប: {formatKHR(totalExpenses)}
        </p>
      </section>

      <ExpenseModal
        open={modalOpen}
        expense={editingExpense}
        onClose={handleCloseModal}
        onSave={handleSave}
      />
    </>
  );
}
