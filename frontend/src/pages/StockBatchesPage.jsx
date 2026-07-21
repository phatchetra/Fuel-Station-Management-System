import StockBatchesSection from "@/components/StockBatchesSection";
import { useAppData } from "@/hooks/useAppData";

export default function StockBatchesPage() {
  const {
    stockBatches,
    stockBatchesLoading,
    handleUpdateStockBatch,
    handleDeleteStockBatch,
  } = useAppData();

  return (
    <div className="page-shell space-y-7">
      <StockBatchesSection
        stockBatches={stockBatches}
        loading={stockBatchesLoading}
        onUpdateBatch={handleUpdateStockBatch}
        onDeleteBatch={handleDeleteStockBatch}
      />
    </div>
  );
}
