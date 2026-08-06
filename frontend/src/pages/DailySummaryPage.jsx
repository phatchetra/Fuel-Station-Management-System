import DailySummary from "@/components/DailySummary";
import { useAppData } from "@/hooks/useAppData";

export default function DailySummaryPage() {
  const {
    activeSummary,
    closingFinancials,
    sessionExpenses,
    todaySales,
    sessionStartAt,
    fuels,
    canCloseDay,
    handleCloseDay,
    handleAddExpense,
    handleUpdateExpense,
    handleDeleteExpense,
    handleUpdateSale,
    handleDeleteSale,
    handleCorrectSale,
  } = useAppData();

  return (
    <div className="page-shell space-y-7">
      <DailySummary
        summary={activeSummary}
        closingFinancials={closingFinancials}
        sessionExpenses={sessionExpenses}
        sessionSales={todaySales}
        sessionStartAt={sessionStartAt}
        fuels={fuels}
        canCloseDay={canCloseDay}
        onCloseDay={handleCloseDay}
        onAddExpense={handleAddExpense}
        onUpdateExpense={handleUpdateExpense}
        onDeleteExpense={handleDeleteExpense}
        onUpdateSale={handleUpdateSale}
        onDeleteSale={handleDeleteSale}
        onCorrectSale={handleCorrectSale}
      />
    </div>
  );
}
