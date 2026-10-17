import Screen from "../components/Screen.tsx";
import { formatRupiah } from "../lib/rupiah.ts";

const sampleMonth = { label: "October 2026", income: 8500000, expense: 6630000 };

// Largest first, as the finished chart will be.
const sampleSpending = [
  { category: "Groceries", amount: 2300000, vsLastMonth: 0.04 },
  { category: "Food and drinks", amount: 1770000, vsLastMonth: 0.18 },
  { category: "Bills and utilities", amount: 1200000, vsLastMonth: 0 },
  { category: "Entertainment", amount: 650000, vsLastMonth: 0.3 },
  { category: "Transport", amount: 460000, vsLastMonth: -0.25 },
  { category: "Other", amount: 250000, vsLastMonth: -0.05 },
];

const sampleInsights = [
  "You saved 22% of your income",
  "Entertainment went over budget by Rp 150.000",
  "Entertainment: 30% more than last month",
  "Transport: 25% less than last month",
];

function formatChange(change: number) {
  if (change === 0) return "same as last month";
  return `${change > 0 ? "▲" : "▼"} ${Math.round(Math.abs(change) * 100)}%`;
}

export default function SummaryScreen() {
  const savings = sampleMonth.income - sampleMonth.expense;
  const savingsRate = Math.round((savings / sampleMonth.income) * 100);
  const max = sampleSpending[0].amount;

  return (
    <Screen
      number={10}
      title="Monthly summary"
      backTo="/"
      shows="One month's income, expense and savings; spending by category as a bar chart, largest first; change vs. the month before; budget results; and up to four insights. Pick the month with previous / next."
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

      <section className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3">
        <h2 className="text-sm font-semibold">Spending by category</h2>
        <ul className="flex flex-col gap-3">
          {sampleSpending.map((c) => (
            <li key={c.category} title={`${c.category}: ${formatRupiah(c.amount)}, ${formatChange(c.vsLastMonth)}`}>
              <div className="flex justify-between gap-2 text-sm">
                <span>{c.category}</span>
                <span className="whitespace-nowrap font-medium">{formatRupiah(c.amount)}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-2 flex-1">
                  <div className="h-full rounded-r bg-brand-600" style={{ width: `${(c.amount / max) * 100}%` }} />
                </div>
                <span className="w-28 text-right text-xs text-slate-500">{formatChange(c.vsLastMonth)}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

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
