import { formatRupiah } from "../lib/rupiah.ts";

/** Spent vs. monthly limit for one category: amber from 80%, red when over. */
export default function BudgetBar({ category, spent, limit }: { category: string; spent: number; limit: number }) {
  const ratio = limit > 0 ? spent / limit : 0;
  const color = ratio > 1 ? "bg-rose-600" : ratio >= 0.8 ? "bg-amber-500" : "bg-brand-600";
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between gap-2 text-sm">
        <span className="font-medium">{category}</span>
        <span className="whitespace-nowrap text-slate-500">
          {formatRupiah(spent)} / {formatRupiah(limit)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(ratio, 1) * 100}%` }} />
      </div>
    </div>
  );
}
