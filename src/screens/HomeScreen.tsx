import BudgetBar from "../components/BudgetBar.tsx";
import GoalProgress from "../components/GoalProgress.tsx";
import Screen, { SecondaryLink } from "../components/Screen.tsx";
import { formatRupiah } from "../lib/rupiah.ts";
import { sampleOpenPayables, sampleOpenReceivables, samplePockets } from "../lib/sampleData.ts";

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
  const pocketsTotal = samplePockets.reduce((sum, p) => sum + p.balance, 0);
  const netWorth = pocketsTotal + sampleOpenReceivables - sampleOpenPayables;

  return (
    <Screen
      number={6}
      title="Home"
      shows="Net worth; this month's income, expense and balance; our dreams (goal progress); payables and receivables due in the next 7 days; this month's budgets; and the shared transaction list, with transfers shown as “BCA → Cash”. Switch between Today and This month, filter by pocket, tap + to add."
    >
      <section className="rounded-xl bg-brand-700 p-4 text-white">
        <div className="text-xs opacity-80">Net worth</div>
        <div className="text-2xl font-bold">{formatRupiah(netWorth)}</div>
        <div className="mt-1 text-xs opacity-80">
          Pockets {formatRupiah(pocketsTotal)} + owed to you {formatRupiah(sampleOpenReceivables)} − you owe{" "}
          {formatRupiah(sampleOpenPayables)}
        </div>
      </section>

      <div className="grid grid-cols-3 gap-2">
        {sampleTotals.map((t) => (
          <div key={t.label} className="rounded-xl bg-slate-50 p-3">
            <div className="text-xs text-slate-500">{t.label}</div>
            <div className={`whitespace-nowrap text-sm font-semibold ${t.color}`}>{formatRupiah(t.amount)}</div>
          </div>
        ))}
      </div>

      <section className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3">
        <h2 className="text-sm font-semibold">Our dreams</h2>
        {samplePockets.map(
          (p) => p.goal && <GoalProgress key={p.name} name={p.name} balance={p.balance} target={p.goal.target} hint={p.goal.hint} />,
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3">
        <h2 className="text-sm font-semibold">Budgets this month</h2>
        {sampleBudgets.map((b) => (
          <BudgetBar key={b.category} {...b} />
        ))}
      </section>

      <SecondaryLink to="/summary">See monthly summary</SecondaryLink>
      <p className="text-xs text-slate-400">Sample numbers only.</p>
    </Screen>
  );
}
