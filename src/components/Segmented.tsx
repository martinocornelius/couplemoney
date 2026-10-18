/** A row of buttons where exactly one is chosen, e.g. Expense | Income. */
export default function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-slate-200/70 p-1 text-sm font-semibold">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-3 py-1.5 ${o.value === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
