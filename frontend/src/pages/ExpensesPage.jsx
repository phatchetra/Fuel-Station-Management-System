import DailyExpenses from "@/components/DailyExpenses";
import { calculateTotalExpensesKHR } from "@/lib/expenseHelpers";
import { useAppData } from "@/hooks/useAppData";

export default function ExpensesPage() {
  const {
    sessionExpenses,
    handleAddExpense,
    handleUpdateExpense,
    handleDeleteExpense,
  } = useAppData();

  return (
    <div className="page-shell space-y-7">
      <DailyExpenses
        expenses={sessionExpenses}
        totalExpenses={calculateTotalExpensesKHR(sessionExpenses)}
        onAddExpense={handleAddExpense}
        onUpdateExpense={handleUpdateExpense}
        onDeleteExpense={handleDeleteExpense}
      />
    </div>
  );
}
