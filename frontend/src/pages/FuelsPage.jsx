import FuelCard from "@/components/FuelCard";
import { useAppData } from "@/hooks/useAppData";

export default function FuelsPage() {
  const {
    fuels,
    handlePriceChange,
    handleCapacityChange,
    handleRecordSale,
    handleRefill,
  } = useAppData();

  return (
    <div className="page-shell space-y-7">
      <section className="feature-grid feature-grid--fuels">
        {fuels.map((fuel) => (
          <FuelCard
            key={fuel.id}
            fuel={fuel}
            onPriceChange={handlePriceChange}
            onCapacityChange={handleCapacityChange}
            onRecordSale={handleRecordSale}
            onRefill={handleRefill}
          />
        ))}
      </section>
    </div>
  );
}
