// Pure helpers behind the charts on the Monthly summary screen (SPEC.md, "Charts").

export type CategoryAmount = { key: string; label: string; amount: number };

export type PieSlice = {
  key: string;
  label: string;
  amount: number;
  /** 0-based position in the chart color order; null for the gray "Everything else" slice. */
  colorIndex: number | null;
  /** Categories inside this slice (more than one only for "Everything else"). */
  members: CategoryAmount[];
};

export const MAX_PIE_SLICES = 6;
export const EVERYTHING_ELSE = "Everything else";

/**
 * Largest first. Up to six categories each get a slice; with more, the five
 * largest get a slice and the rest share one "Everything else" slice.
 */
export function pieSlices(rows: CategoryAmount[]): PieSlice[] {
  const sorted = rows
    .filter((r) => r.amount > 0)
    .sort((a, b) => b.amount - a.amount || a.label.localeCompare(b.label));
  const own = sorted.length <= MAX_PIE_SLICES ? sorted : sorted.slice(0, MAX_PIE_SLICES - 1);
  const rest = sorted.slice(own.length);
  const slices: PieSlice[] = own.map((r, i) => ({ ...r, colorIndex: i, members: [r] }));
  if (rest.length > 0) {
    slices.push({
      key: "__everything_else",
      label: EVERYTHING_ELSE,
      amount: rest.reduce((sum, r) => sum + r.amount, 0),
      colorIndex: null,
      members: rest,
    });
  }
  return slices;
}

/** A pie of one or two slices says nothing; show only the list then. */
export function shouldShowPie(rows: CategoryAmount[]): boolean {
  return rows.filter((r) => r.amount > 0).length >= 3;
}

/** Whole percentages that always add up to 100 (largest remainder method). */
export function percentages(amounts: number[]): number[] {
  const total = amounts.reduce((sum, a) => sum + a, 0);
  if (total <= 0) return amounts.map(() => 0);
  const exact = amounts.map((a) => (a / total) * 100);
  const floors = exact.map(Math.floor);
  let missing = 100 - floors.reduce((sum, f) => sum + f, 0);
  const byRemainder = exact
    .map((e, i) => ({ i, remainder: e - floors[i] }))
    .sort((a, b) => b.remainder - a.remainder);
  for (const { i } of byRemainder) {
    if (missing <= 0) break;
    floors[i] += 1;
    missing -= 1;
  }
  return floors;
}

/** Round axis ticks from 0 to just above max, about 4 steps (1, 2, 2.5 or 5 × 10^n). */
export function axisTicks(max: number): number[] {
  if (max <= 0) return [0, 1000];
  const rough = max / 4;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= rough) ?? 10 * power;
  const ticks = [0];
  while (ticks[ticks.length - 1] < max) ticks.push(ticks.length * step);
  return ticks;
}
