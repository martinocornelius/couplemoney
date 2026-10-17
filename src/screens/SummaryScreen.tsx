import Screen from "../components/Screen.tsx";
import { formatRupiah } from "../lib/rupiah.ts";

const sampleMonth = { label: "September 2026", income: 8500000, expense: 6630000, unrecorded: -350000 };

type CategoryRow = { category: string; amount: number; vsLastMonth?: number };

const sampleIncome: CategoryRow[] = [
  { category: "Salary", amount: 7500000 },
  { category: "Side income", amount: 1000000 },
];

// Largest first, as the finished chart will be.
const sampleSpending: CategoryRow[] = [
  { category: "Groceries", amount: 2300000, vsLastMonth: 0.04 },
  { category: "Food and drinks", amount: 1770000, vsLastMonth: 0.18 },
  { category: "Bills and utilities", amount: 1200000, vsLastMonth: 0 },
  { category: "Entertainment", amount: 650000, vsLastMonth: 0.3 },
  { category: "Transport", amount: 460000, vsLastMonth: -0.25 },
  { category: "Other", amount: 250000, vsLastMonth: -0.05 },
];

const sampleInsights = [
  "You saved 22% of your income",
  "Rp 350.000 left your pockets without being logged",
  "Entertainment went over budget by Rp 150.000",
  "Entertainment: 30% more than last month",
];

function formatChange(change: number) {
  if (change === 0) return "same as last month";
  return `${change > 0 ? "▲" : "▼"} ${Math.round(Math.abs(change) * 100)}%`;
}

/** One bar per category, scaled to the largest; one hue because it's a single series. */
function CategoryBars({ title, rows }: { title: string; rows: CategoryRow[] }) {
  const max = Math.max(...rows.map((r) => r.amount));
  return (
    <section className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3">
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="flex flex-col gap-3">
        {rows.map((r) => (
          <li
            key={r.category}
            title={`${r.category}: ${formatRupiah(r.amount)}${r.vsLastMonth === undefined ? "" : `, ${formatChange(r.vsLastMonth)}`}`}
          >
            <div className="flex justify-between gap-2 text-sm">
              <span>{r.category}</span>
              <span className="whitespace-nowrap font-medium">{formatRupiah(r.amount)}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-2 flex-1">
                <div className="h-full rounded-r bg-brand-600" style={{ width: `${(r.amount / max) * 100}%` }} />
              </div>
              {r.vsLastMonth !== undefined && (
                <span className="w-28 text-right text-xs text-slate-500">{formatChange(r.vsLastMonth)}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function SummaryScreen() {
  const savings = sampleMonth.income - sampleMonth.expense;
  const savingsRate = Math.round((savings / sampleMonth.income) * 100);

  return (
    <Screen
      number={14}
      title="Monthly summary"
      backTo="/"
      shows="One month's income, expense and savings; where the money came from and where it went (bar charts, largest first); change vs. the month before; budget results; unrecorded money; and up to four insights. Pick the month with previous / next; tap a category to see its transactions."
    >
      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-2 py-1">
        <button disabled aria-label="Previous month" className="px-3 py-2 text-xl text-slate-400">
          ‹
        </button>
        <span className="font-semibold">{sampleMonth.label}</span>
        <button disabled aria-label="Next month" className="px-3 py-2 text-xl text-slate-400">
          ›
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Income" value={formatRupiah(sampleMonth.income)} />
        <Stat label="Expense" value={formatRupiah(sampleMonth.expense)} />
        <Stat label={`Saved (${savingsRate}%)`} value={formatRupiah(savings)} />
      </div>

      <CategoryBars title="Where it came from" rows={sampleIncome} />
      <CategoryBars title="Where it went" rows={sampleSpending} />

      <div className="flex justify-between gap-2 rounded-xl bg-slate-50 p-3 text-sm">
        <span>Unrecorded money (balance adjustments)</span>
        <span className="whitespace-nowrap font-semibold">{formatRupiah(sampleMonth.unrecorded)}</span>
      </div>

      <section className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3">
        <h2 className="text-sm font-semibold">Insights</h2>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
          {sampleInsights.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-slate-400">Sample numbers only.</p>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="whitespace-nowrap text-sm font-semibold">{value}</div>
    </div>
  );
}
