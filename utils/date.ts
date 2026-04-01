// utils/date.ts

/**
 * Convert a Date (or date-like) to a local YYYY-MM-DD string.
 * This avoids UTC offset issues when using toISOString().
 */
export function toLocalYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse various stored date formats into a Date. */
export function parseDate(value: unknown): Date | null {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const dt = new Date(value);
    if (!isNaN(dt.getTime())) return dt;
  }
  return null;
}

export function isSameMonth(d: Date, month: number, year: number): boolean {
  return d.getMonth() === month && d.getFullYear() === year;
}
