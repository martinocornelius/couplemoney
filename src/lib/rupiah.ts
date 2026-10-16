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
