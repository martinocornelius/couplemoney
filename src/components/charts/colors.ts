// Chart series colors, in the fixed order from SPEC.md. Values live in index.css.
export const SERIES_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];
export const OTHER_COLOR = "var(--chart-other)";

export function sliceColor(colorIndex: number | null): string {
  return colorIndex === null ? OTHER_COLOR : SERIES_COLORS[colorIndex];
}
