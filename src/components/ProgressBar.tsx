/** Thin horizontal bar; ratio is 0..1 (values above 1 show as full). */
export default function ProgressBar({ ratio, color = "bg-brand-600" }: { ratio: number; color?: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
      <div className={`h-full ${color}`} style={{ width: `${Math.min(Math.max(ratio, 0), 1) * 100}%` }} />
    </div>
  );
}
