// The server's dates are Western Indonesia Time text, like 2026-10-20T14:05:00.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-20T14:05:00" -> "20 Oct 2026, 14:05"; "2026-10-20" -> "20 Oct 2026". */
export function formatWib(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(value);
  if (!match) return value;
  const [, year, month, day, hour, minute] = match;
  const date = `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`;
  return hour ? `${date}, ${hour}:${minute}` : date;
}
