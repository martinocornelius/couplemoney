import type { KeyboardEvent } from "react";
import type { PieSlice } from "../../lib/charts.ts";
import { formatRupiah } from "../../lib/rupiah.ts";
import { sliceColor } from "./colors.ts";

const SIZE = 200;
const OUTER = 92;
const INNER = 64;
const GAP = 2; // px of card surface between slices

type Props = {
  slices: PieSlice[];
  /** Whole-percent share of each slice, same order as slices; adds up to 100. */
  shares: number[];
  total: number;
  /** What the total is, e.g. "Expense". */
  totalLabel: string;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
};

/** 0 = top, clockwise, in radians. */
function point(radius: number, angle: number): string {
  return `${SIZE / 2 + radius * Math.sin(angle)} ${SIZE / 2 - radius * Math.cos(angle)}`;
}

function slicePath(start: number, end: number): string {
  // Pad each side by half the gap; the angle differs by radius so the gap stays parallel.
  const span = end - start;
  const padOuter = Math.min(GAP / 2 / OUTER, span / 4);
  const padInner = Math.min(GAP / 2 / INNER, span / 4);
  const large = span - 2 * padOuter > Math.PI ? 1 : 0;
  return [
    `M ${point(OUTER, start + padOuter)}`,
    `A ${OUTER} ${OUTER} 0 ${large} 1 ${point(OUTER, end - padOuter)}`,
    `L ${point(INNER, end - padInner)}`,
    `A ${INNER} ${INNER} 0 ${large} 0 ${point(INNER, start + padInner)}`,
    "Z",
  ].join(" ");
}

/** Ring-shaped pie, largest slice first from the top. Tap a slice to see it in the middle. */
export default function DonutChart({ slices, shares, total, totalLabel, selectedKey, onSelect }: Props) {
  const selectedIndex = slices.findIndex((s) => s.key === selectedKey);
  const selected = selectedIndex >= 0 ? slices[selectedIndex] : null;

  let angle = 0;
  const arcs = slices.map((slice) => {
    const start = angle;
    angle += total > 0 ? (slice.amount / total) * 2 * Math.PI : 0;
    return { slice, path: slicePath(start, angle) };
  });

  const toggle = (key: string) => onSelect(key === selectedKey ? null : key);
  const onKey = (e: KeyboardEvent, key: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle(key);
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-[220px]">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="block w-full" role="img" aria-label={`${totalLabel} by category`}>
        {arcs.map(({ slice, path }, i) => (
          <path
            key={slice.key}
            d={path}
            fill={sliceColor(slice.colorIndex)}
            opacity={selected && selected.key !== slice.key ? 0.3 : 1}
            className="cursor-pointer outline-none transition-opacity"
            role="button"
            tabIndex={0}
            aria-label={`${slice.label}: ${formatRupiah(slice.amount)}, ${shares[i]}%`}
            aria-pressed={selected?.key === slice.key}
            onClick={() => toggle(slice.key)}
            onKeyDown={(e) => onKey(e, slice.key)}
          />
        ))}
      </svg>
      {/* Middle of the ring: the total, or the tapped slice. HTML so long names can wrap. */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-12 text-center">
        {selected ? (
          <>
            <span className="text-xs leading-tight text-slate-600">{selected.label}</span>
            <span className="text-base font-semibold text-slate-900">{formatRupiah(selected.amount)}</span>
            <span className="text-xs text-slate-600">{shares[selectedIndex]}%</span>
          </>
        ) : (
          <>
            <span className="text-xs text-slate-600">{totalLabel}</span>
            <span className="text-base font-semibold text-slate-900">{formatRupiah(total)}</span>
          </>
        )}
      </div>
    </div>
  );
}
