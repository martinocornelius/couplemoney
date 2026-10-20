// Dates are text in Western Indonesia Time (UTC+7), like 2026-10-16T09:30:00,
// the same as the database defaults (SPEC.md, Data model). Text in this form
// sorts in time order, so the Worker can compare dates as strings.

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

const WIB_OFFSET = 7 * HOUR;

export function wib(date: Date): string {
  return new Date(date.getTime() + WIB_OFFSET).toISOString().slice(0, 19);
}

export function wibAfter(date: Date, ms: number): string {
  return wib(new Date(date.getTime() + ms));
}

/** Whole minutes from `date` until a WIB time, rounded up, never below 1. */
export function minutesUntil(date: Date, wibTime: string): number {
  const target = Date.parse(`${wibTime}Z`) - WIB_OFFSET;
  return Math.max(1, Math.ceil((target - date.getTime()) / MINUTE));
}
