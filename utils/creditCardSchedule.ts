// utils/creditCardSchedule.ts

import { toLocalYMD } from './date';

export type CreditCardCycle = {
  statementDay?: number;
  dueDay?: number;
};

function clampDayToMonth(year: number, month0: number, day: number): number {
  // month0: 0-11
  const lastDay = new Date(year, month0 + 1, 0).getDate();
  return Math.max(1, Math.min(day, lastDay));
}

export function getCycleDate(year: number, month0: number, day: number): string {
  const d = clampDayToMonth(year, month0, day);
  return toLocalYMD(new Date(year, month0, d));
}

/**
 * For a given month, return the statement and due dates (YYYY-MM-DD) if configured.
 * If day doesn't exist in month (e.g., 31), clamps to last day.
 */
export function getStatementAndDueForMonth(
  year: number,
  month0: number,
  cycle: CreditCardCycle
): { statementDate?: string; dueDate?: string } {
  const statementDate = (typeof cycle.statementDay === 'number' && cycle.statementDay >= 1)
    ? getCycleDate(year, month0, cycle.statementDay)
    : undefined;
  const dueDate = (typeof cycle.dueDay === 'number' && cycle.dueDay >= 1)
    ? getCycleDate(year, month0, cycle.dueDay)
    : undefined;
  return { statementDate, dueDate };
}
