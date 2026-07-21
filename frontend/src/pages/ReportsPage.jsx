import ClosedReportsSection from "@/components/ClosedReportsSection";
import { useAppData } from "@/hooks/useAppData";

export default function ReportsPage() {
  const { dailyReports } = useAppData();

  return (
    <div className="page-shell space-y-7">
      <ClosedReportsSection dailyReports={dailyReports} />
    </div>
  );
}
