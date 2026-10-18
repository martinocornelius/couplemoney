import { formatRupiah } from "../lib/rupiah.ts";
import ProgressBar from "./ProgressBar.tsx";

/** A savings goal: the pocket's balance against its target, plus a hint line. */
export default function GoalProgress({ name, balance, target, hint }: { name: string; balance: number; target: number; hint: string }) {
  const ratio = target > 0 ? balance / target : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between gap-2 text-sm">
        <span className="font-medium">{name}</span>
        <span className="whitespace-nowrap text-slate-500">{Math.floor(ratio * 100)}%</span>
      </div>
      <ProgressBar ratio={ratio} />
      <div className="flex justify-between gap-2 text-xs text-slate-500">
        <span>
          {formatRupiah(balance)} of {formatRupiah(target)}
        </span>
        <span className="text-right">{hint}</span>
      </div>
    </div>
  );
}
