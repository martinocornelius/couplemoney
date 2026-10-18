import { useState } from "react";
import { axisTicks } from "../../lib/charts.ts";
import { formatRupiah, formatRupiahShort } from "../../lib/rupiah.ts";

export type TrendSeries = { key: string; label: string; color: string; values: number[] };
export type TrendMonth = { label: string; longLabel: string; partial?: boolean };

const W = 340;
const H = 200;
const PAD = { left: 58, right: 22, top: 12, bottom: 36 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

/**
 * Month-by-month lines. An unfinished last month is joined with a dashed line
 * and labeled "so far". Tap (or hover) a month to read every series there.
 */
export default function TrendChart({ months, series }: { months: TrendMonth[]; series: TrendSeries[] }) {
  const [selected, setSelected] = useState(months.length - 1);
  const sel = Math.min(selected, months.length - 1);
  const ticks = axisTicks(Math.max(...series.flatMap((s) => s.values)));
  const top = ticks[ticks.length - 1];
  const step = months.length > 1 ? PLOT_W / (months.length - 1) : 0;
  const x = (i: number) => PAD.left + (months.length > 1 ? i * step : PLOT_W / 2);
  const y = (v: number) => PAD.top + PLOT_H - (v / top) * PLOT_H;
  const lastPartial = months[months.length - 1]?.partial === true;
  const solidEnd = lastPartial ? months.length - 2 : months.length - 1;

  const line = (values: number[], from: number, to: number) =>
    values
      .slice(from, to + 1)
      .map((v, i) => `${i === 0 ? "M" : "L"} ${x(from + i)} ${y(v)}`)
      .join(" ");

  return (
    <div className="flex flex-col gap-2">
      {series.length > 1 && (
        <div className="flex gap-4 text-xs text-slate-600">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 rounded" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}

      {/* Readout for the tapped month: values first, names second. */}
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-lg bg-white px-3 py-2 text-xs" aria-live="polite">
        <span className="font-medium text-slate-600">{months[sel].longLabel}</span>
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 rounded" style={{ background: s.color }} />
            <span className="font-semibold text-slate-900">{formatRupiah(s.values[sel])}</span>
            <span className="text-slate-500">{s.label}</span>
          </span>
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Month by month trend">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--chart-grid)" strokeWidth={1} shapeRendering="crispEdges" />
            <text x={PAD.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="var(--chart-axis-text)" className="tabular-nums">
              {formatRupiahShort(t)}
            </text>
          </g>
        ))}

        <line x1={x(sel)} x2={x(sel)} y1={PAD.top} y2={PAD.top + PLOT_H} stroke="var(--chart-crosshair)" strokeWidth={1} shapeRendering="crispEdges" />

        {series.map((s) => (
          <g key={s.key} fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            {solidEnd > 0 && <path d={line(s.values, 0, solidEnd)} />}
            {lastPartial && months.length > 1 && <path d={line(s.values, months.length - 2, months.length - 1)} strokeDasharray="4 4" />}
          </g>
        ))}
        {series.map((s) =>
          s.values.map((v, i) => (
            <circle key={`${s.key}-${i}`} cx={x(i)} cy={y(v)} r={i === sel ? 5 : 4} fill={s.color} stroke="var(--chart-surface)" strokeWidth={2} />
          )),
        )}

        {months.map((m, i) => (
          <g key={m.label}>
            <text x={x(i)} y={H - PAD.bottom + 16} textAnchor="middle" fontSize={10.5} fill="var(--chart-axis-text)">
              {m.label}
            </text>
            {m.partial && (
              <text x={x(i)} y={H - PAD.bottom + 29} textAnchor="middle" fontSize={9.5} fill="var(--chart-axis-text)">
                so far
              </text>
            )}
          </g>
        ))}

        {/* Wide invisible columns, so a tap anywhere near a month picks it. */}
        {months.map((m, i) => {
          const left = i === 0 ? PAD.left - 20 : x(i) - step / 2;
          const right = i === months.length - 1 ? W : x(i) + step / 2;
          return (
            <rect
              key={m.label}
              x={left}
              y={0}
              width={right - left}
              height={H}
              fill="transparent"
              className="cursor-pointer outline-none"
              tabIndex={0}
              aria-label={`${m.longLabel}: ${series.map((s) => `${s.label} ${formatRupiah(s.values[i])}`).join(", ")}`}
              onPointerEnter={() => setSelected(i)}
              onClick={() => setSelected(i)}
              onFocus={() => setSelected(i)}
            />
          );
        })}
      </svg>
    </div>
  );
}
