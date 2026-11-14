import { birthdayDayInYear, DAY_MS, type Person } from "./birthdays";

export interface Cell {
  year: number;
  month: number; // 0 to 11
  day: number;
  inMonth: boolean;
}

/** Weeks (Monday first) covering the given month, padded with days of the months around it. */
export function monthGrid(year: number, month: number): Cell[] {
  const first = new Date(Date.UTC(year, month, 1));
  const offset = (first.getUTCDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const total = Math.ceil((offset + daysInMonth) / 7) * 7;
  const cells: Cell[] = [];
  for (let i = 0; i < total; i += 1) {
    const d = new Date(Date.UTC(year, month, 1 - offset + i));
    cells.push({
      year: d.getUTCFullYear(),
      month: d.getUTCMonth(),
      day: d.getUTCDate(),
      inMonth: d.getUTCMonth() === month,
    });
  }
  return cells;
}

/** People grouped by the day their birthday falls on in that month and year. */
export function birthdaysInMonth(people: Person[], year: number, month: number): Map<number, Person[]> {
  const byDay = new Map<number, Person[]>();
  for (const p of people) {
    if (p.month !== month + 1) continue;
    const day = birthdayDayInYear(p, year);
    const list = byDay.get(day) ?? [];
    list.push(p);
    byDay.set(day, list);
  }
  return byDay;
}

/** Whole days from today to a date (negative when in the past). */
export function daysFromToday(today: Date, year: number, month: number, day: number): number {
  const t = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((Date.UTC(year, month, day) - t) / DAY_MS);
}
