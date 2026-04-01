// utils/creditCardCycleStorage.ts

import { readJson, writeJson } from './storage';
import { CreditCardCycle, CYCLES_KEY, getCurrentYearMonth, createOpenCycle } from './creditCardCycles';

export function loadCycles(): CreditCardCycle[] {
  return readJson<CreditCardCycle[]>(CYCLES_KEY) ?? [];
}

export function saveCycles(cycles: CreditCardCycle[]): void {
  writeJson(CYCLES_KEY, cycles);
}

export function upsertCycle(cycles: CreditCardCycle[], cycle: CreditCardCycle): CreditCardCycle[] {
  const idx = cycles.findIndex(c => c.id === cycle.id);
  if (idx >= 0) {
    const next = [...cycles];
    next[idx] = cycle;
    return next;
  }
  return [...cycles, cycle];
}

export function getOrCreateCurrentCycle(card: any, cycles: CreditCardCycle[], now = new Date()): { cycle: CreditCardCycle; cycles: CreditCardCycle[] } {
  const { year, month0, yearMonth } = getCurrentYearMonth(now);
  const id = `ccyc_${card.id}_${yearMonth}`;
  const existing = cycles.find(c => c.id === id);
  if (existing) return { cycle: existing, cycles };
  const created = createOpenCycle(card, year, month0);
  return { cycle: created, cycles: [...cycles, created] };
}
