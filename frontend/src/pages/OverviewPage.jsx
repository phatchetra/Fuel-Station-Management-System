import QuickStats from "@/components/QuickStats";
import { useAppData } from "@/hooks/useAppData";

export default function OverviewPage() {
  const { quickStats } = useAppData();

  return (
    <div className="page-shell space-y-7">
      <QuickStats
        totalLitersSold={quickStats.totalLitersSold}
        fuelSalesKHR={quickStats.fuelSalesKHR}
        unpaidDebtCount={quickStats.unpaidDebtCount}
        lowStockCount={quickStats.lowStockCount}
      />
    </div>
  );
}
