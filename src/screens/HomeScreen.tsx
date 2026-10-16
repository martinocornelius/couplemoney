import BudgetBar from "../components/BudgetBar.tsx";
import Screen from "../components/Screen.tsx";
import { formatRupiah } from "../lib/rupiah.ts";

const sampleTotals = [
  { label: "Income", amount: 8500000, color: "text-emerald-700" },
  { label: "Expense", amount: 3250000, color: "text-rose-700" },
  { label: "Balance", amount: 5250000, color: "text-slate-900" },
];

const sampleBudgets = [
  { category: "Food and drinks", spent: 1200000, limit: 3000000 },
  { category: "Groceries", spent: 1700000, limit: 2000000 },
  { category: "Entertainment", spent: 650000, limit: 500000 },
];

export default function HomeScreen() {
  return (
    <Screen
      number={3}
      title="Home"
      shows="This month's income, expense and balance; total across all pockets; payables and receivables due in the next 7 days; this month's budgets (spent vs. limit per category); and the shared transaction list. Switch between Today and This month, filter by pocket, tap + to add."
    >
      <div className="grid grid-cols-3 gap-2">
        {sampleTotals.map((t) => (
          <div key={t.label} className="rounded-xl bg-slate-50 p-3">
            <div className="text-xs text-slate-500">{t.label}</div>
            <div className={`whitespace-nowrap text-sm font-semibold ${t.color}`}>{formatRupiah(t.amount)}</div>
          </div>
        ))}
      </div>
      <section className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3">
        <h2 className="text-sm font-semibold">Budgets this month</h2>
        {sampleBudgets.map((b) => (
          <BudgetBar key={b.category} {...b} />
        ))}
      </section>
      <p className="text-xs text-slate-400">Sample numbers only.</p>
    </Screen>
  );
}
