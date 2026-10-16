import Screen from "../components/Screen.tsx";
import { formatRupiah } from "../lib/rupiah.ts";

const sampleTotals = [
  { label: "Income", amount: 8500000, color: "text-emerald-700" },
  { label: "Expense", amount: 3250000, color: "text-rose-700" },
  { label: "Balance", amount: 5250000, color: "text-slate-900" },
];

export default function HomeScreen() {
  return (
    <Screen
      number={3}
      title="Home"
      shows="This month's income, expense and balance; total across all pockets; payables and receivables due in the next 7 days; and the shared transaction list. Switch between Today and This month, filter by pocket, tap + to add."
    >
      <div className="grid grid-cols-3 gap-2">
        {sampleTotals.map((t) => (
          <div key={t.label} className="rounded-xl bg-slate-50 p-3">
            <div className="text-xs text-slate-500">{t.label}</div>
            <div className={`whitespace-nowrap text-sm font-semibold ${t.color}`}>{formatRupiah(t.amount)}</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400">Sample numbers only.</p>
    </Screen>
  );
}
