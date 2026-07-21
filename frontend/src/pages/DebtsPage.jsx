import DebtManager from "@/components/DebtManager";
import { useAppData } from "@/hooks/useAppData";

export default function DebtsPage() {
  const {
    debts,
    exchangeRate,
    handleAddDebt,
    handleRecordPayment,
    handleDeleteDebt,
  } = useAppData();

  return (
    <div className="page-shell space-y-7">
      <DebtManager
        debts={debts}
        exchangeRate={exchangeRate}
        onAddDebt={handleAddDebt}
        onRecordPayment={handleRecordPayment}
        onDeleteDebt={handleDeleteDebt}
      />
    </div>
  );
}
