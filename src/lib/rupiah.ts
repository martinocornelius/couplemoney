/**
 * Formats a whole-rupiah amount for display: 25000 -> "Rp 25.000".
 * Thousands use dots, there are no decimals, and negatives become "-Rp 25.000".
 */
export function formatRupiah(amount: number): string {
  const rounded = Math.round(amount);
  const digits = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${rounded < 0 ? "-" : ""}Rp ${digits}`;
}

const SHORT_UNITS = [
  { size: 1e9, suffix: "M" }, // miliar
  { size: 1e6, suffix: "jt" }, // juta
  { size: 1e3, suffix: "rb" }, // ribu
];

/**
 * Short form for chart axes only: 750000 -> "Rp 750 rb", 5200000 -> "Rp 5,2 jt",
 * 1200000000 -> "Rp 1,2 M". One decimal at most, written with a comma.
 */
export function formatRupiahShort(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  if (Math.round(abs) < 1000) return `${sign}Rp ${Math.round(abs)}`;
  // Smallest unit first; when rounding reaches 1000 (999.950 -> "1000 rb"),
  // move up to the next unit instead ("1 jt").
  for (let i = SHORT_UNITS.length - 1; i >= 0; i--) {
    const { size, suffix } = SHORT_UNITS[i];
    const value = Math.round((abs / size) * 10) / 10;
    if (value < 1000 || i === 0) {
      return `${sign}Rp ${value.toString().replace(".", ",")} ${suffix}`;
    }
  }
  return `${sign}Rp ${Math.round(abs)}`;
}
