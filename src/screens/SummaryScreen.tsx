import { useState } from "react";
import DonutChart from "../components/charts/DonutChart.tsx";
import TrendChart, { type TrendSeries } from "../components/charts/TrendChart.tsx";
import { OTHER_COLOR, SERIES_COLORS, sliceColor } from "../components/charts/colors.ts";
import Screen from "../components/Screen.tsx";
import Segmented from "../components/Segmented.tsx";
import { categoryEmoji, type CategoryKind } from "../../shared/categories.ts";
import { percentages, pieSlices, shouldShowPie } from "../lib/charts.ts";
import { formatRupiah } from "../lib/rupiah.ts";
import {
  sampleExpenseByCategory,
  sampleIncomeByCategory,
  sampleInsights,
  sampleMonth,
  sampleTrendByCategory,
  sampleTrendExpense,
  sampleTrendIncome,
  sampleTrendMonths,
  sumAmounts,
} from "../lib/sampleData.ts";

type View = "categories" | "trend";

function formatChange(amount: number, previous: number): string {
  if (previous === 0) return amount > 0 ? "new" : "–";
  const change = Math.round(((amount - previous) / previous) * 100);
  if (change === 0) return "same";
  return `${change > 0 ? "▲" : "▼"} ${Math.abs(change)}%`;
}

export default function SummaryScreen() {
  const [view, setView] = useState<View>("categories");
  const [kind, setKind] = useState<CategoryKind>("expense");
  const [monthCount, setMonthCount] = useState<3 | 6>(6);
  const [trendCategory, setTrendCategory] = useState("all");
  const [selectedSlice, setSelectedSlice] = useState<string | null>(null);

  const income = sumAmounts(sampleIncomeByCategory);
  const expense = sumAmounts(sampleExpenseByCategory);
  const savings = income - expense;

  // Categories view: every category largest first; the pie folds the small ones.
  const rows = (kind === "expense" ? sampleExpenseByCategory : sampleIncomeByCategory)
    .map((r) => ({ key: r.name, label: r.name, amount: r.amount, previous: r.previous }))
    .sort((a, b) => b.amount - a.amount);
  const rowShares = percentages(rows.map((r) => r.amount));
  const slices = pieSlices(rows);
  const sliceShares = slices.map((s) =>
    s.members.reduce((sum, m) => sum + rowShares[rows.findIndex((r) => r.key === m.key)], 0),
  );
  const sliceOf = (key: string) => slices.find((s) => s.members.some((m) => m.key === key));

  // Trend view: the last 3 or 6 months.
  const from = sampleTrendMonths.length - monthCount;
  const trendMonths = sampleTrendMonths.slice(from);
  const incomeValues = sampleTrendIncome.slice(from);
  const expenseValues = sampleTrendExpense.slice(from);
  const series: TrendSeries[] =
    trendCategory === "all"
      ? [
          { key: "income", label: "Income", color: SERIES_COLORS[0], values: incomeValues },
          { key: "expense", label: "Expense", color: SERIES_COLORS[1], values: expenseValues },
        ]
      : [{ key: trendCategory, label: trendCategory, color: SERIES_COLORS[0], values: sampleTrendByCategory[trendCategory].slice(from) }];

  return (
    <Screen
      number={14}
      title="Monthly summary"
      backTo="/"
      shows="One month's income, expense and savings; a chart card with two views, Categories (pie chart + full list) and Trend (line chart + table); change vs. the month before; budget results; unrecorded money; insights; and Export to Excel."
    >
      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-2 py-1">
        <button disabled aria-label="Previous month" className="px-3 py-2 text-xl text-slate-400">
          ‹
        </button>
        <span className="font-semibold">
          {sampleMonth.label}
          {sampleMonth.partial && <span className="font-normal text-slate-500"> · so far</span>}
        </span>
        <button disabled aria-label="Next month" className="px-3 py-2 text-xl text-slate-400">
          ›
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Income" value={formatRupiah(income)} />
        <Stat label="Expense" value={formatRupiah(expense)} />
        <Stat label={`Saved (${Math.round((savings / income) * 100)}%)`} value={formatRupiah(savings)} />
      </div>

      <section className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3">
        <Segmented
          label="Chart"
          value={view}
          onChange={setView}
          options={[
            { value: "categories", label: "Categories" },
            { value: "trend", label: "Trend" },
          ]}
        />

        {view === "categories" ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">{kind === "expense" ? "Where it went" : "Where it came from"}</h2>
              <Segmented
                label="Expense or income"
                value={kind}
                onChange={(k) => {
                  setKind(k);
                  setSelectedSlice(null);
                }}
                options={[
                  { value: "expense", label: "Expense" },
                  { value: "income", label: "Income" },
                ]}
              />
            </div>
            {shouldShowPie(rows) && (
              <DonutChart
                slices={slices}
                shares={sliceShares}
                total={sumAmounts(rows)}
                totalLabel={kind === "expense" ? "Expense" : "Income"}
                selectedKey={selectedSlice}
                onSelect={setSelectedSlice}
              />
            )}
            {/* The list doubles as the chart's table: every category, nothing hidden behind a tap. */}
            <ul className="flex flex-col">
              {rows.map((r, i) => {
                const slice = sliceOf(r.key);
                const isSelected = slice !== undefined && slice.key === selectedSlice;
                return (
                  <li key={r.key}>
                    <button
                      type="button"
                      onClick={() => slice && setSelectedSlice(isSelected ? null : slice.key)}
                      className={`flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${isSelected ? "bg-white shadow-sm" : ""}`}
                    >
                      <span
                        className="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: slice ? sliceColor(slice.colorIndex) : OTHER_COLOR }}
                        aria-hidden
                      />
                      <span aria-hidden>{categoryEmoji(kind, r.label)}</span>
                      <span className="flex flex-1 flex-col">
                        <span className="flex justify-between gap-2">
                          <span>{r.label}</span>
                          <span className="whitespace-nowrap font-medium tabular-nums">{formatRupiah(r.amount)}</span>
                        </span>
                        <span className="text-xs text-slate-500">
                          {rowShares[i]}% · {formatChange(r.amount, r.previous)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="text-xs text-slate-500">Change is against the same days of last month.</p>
          </>
        ) : (
          <>
            <h2 className="text-sm font-semibold">
              {trendCategory === "all" ? "Income and expense per month" : `${trendCategory} per month`}
            </h2>
            <Segmented
              label="Months"
              value={monthCount}
              onChange={setMonthCount}
              options={[
                { value: 3, label: "Last 3 months" },
                { value: 6, label: "Last 6 months" },
              ]}
            />
            <label className="flex items-center gap-2 text-sm">
              <span className="text-slate-600">Show</span>
              <select
                value={trendCategory}
                onChange={(e) => setTrendCategory(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5"
              >
                <option value="all">Income and expense</option>
                {Object.keys(sampleTrendByCategory).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <TrendChart key={`${monthCount}-${trendCategory}`} months={trendMonths} series={series} />
            <table className="w-full whitespace-nowrap text-xs tabular-nums">
              <thead className="text-xs text-slate-500">
                <tr>
                  <th className="py-1 text-left font-medium">Month</th>
                  {series.map((s) => (
                    <th key={s.key} className="py-1 pl-3 text-right font-medium">
                      {s.label}
                    </th>
                  ))}
                  {trendCategory === "all" && <th className="py-1 pl-3 text-right font-medium">Saved</th>}
                </tr>
              </thead>
              <tbody>
                {trendMonths.map((m, i) => (
                  <tr key={m.label} className="border-t border-slate-200">
                    <td className="py-1">{m.partial ? `${m.label} (so far)` : m.label}</td>
                    {series.map((s) => (
                      <td key={s.key} className="py-1 pl-3 text-right">
                        {formatRupiah(s.values[i])}
                      </td>
                    ))}
                    {trendCategory === "all" && <td className="py-1 pl-3 text-right">{formatRupiah(incomeValues[i] - expenseValues[i])}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

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

      <div className="flex flex-col gap-1">
        <button disabled className="rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-400">
          Export to Excel
        </button>
        <p className="text-center text-xs text-slate-400">Downloads an .xlsx file; works from Milestone 13.</p>
      </div>

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
