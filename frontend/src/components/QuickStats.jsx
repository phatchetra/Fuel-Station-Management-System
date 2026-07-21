import { formatLiters } from "@/lib/formatters";
import { IconAlert, IconFuel, IconTrending, IconUsers } from "./icons";

const STAT_STYLES = {
  income: {
    iconWrap: "stat-icon stat-icon-gold",
    Icon: IconTrending,
  },
  liters: {
    iconWrap: "stat-icon stat-icon-blue",
    Icon: IconFuel,
  },
  debts: {
    iconWrap: "stat-icon stat-icon-green",
    Icon: IconUsers,
  },
  stock: {
    iconWrap: "stat-icon stat-icon-red",
    Icon: IconAlert,
  },
};

function StatCard({ type, label, value, sub }) {
  const { iconWrap, Icon } = STAT_STYLES[type];

  return (
    <article className="stat-card">
      <div className={iconWrap}>
        <Icon />
      </div>
      <div className="min-w-0 flex-1">
        <p className="khmer-label mb-1">{label}</p>
        <p className="stat-value tabular-nums en">{value}</p>
        {sub && <p className="muted-text mt-1">{sub}</p>}
      </div>
    </article>
  );
}

export default function QuickStats({
  totalLitersSold,
  unpaidDebtCount,
  lowStockCount,
  fuelSalesKHR,
}) {
  return (
    <section className="feature-grid feature-grid--stats">
      <StatCard
        type="liters"
        label="លក់ថ្ងៃនេះ"
        value={formatLiters(totalLitersSold)}
        sub="សរុបលីត្រ"
      />
      <StatCard
        type="income"
        label="ចំណូលប្រេង"
        value={`${fuelSalesKHR.toLocaleString("en-US")} ៛`}
        sub="មិនរួមបំណុល"
      />
      <StatCard
        type="debts"
        label="អ្នកជំពាក់"
        value={unpaidDebtCount}
        sub="មិនទាន់សងរួច"
      />
      <StatCard
        type="stock"
        label="ស្តុកទាប"
        value={lowStockCount}
        sub={lowStockCount > 0 ? "ត្រូវបញ្ចូលរួច" : "ស្តុកគ្រប់គ្រាន"}
      />
    </section>
  );
}
