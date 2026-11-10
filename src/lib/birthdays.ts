import { csvToRecords } from "./csv";

export interface Person {
  id: string;
  name: string;
  month: number; // 1 to 12
  day: number; // 1 to 31
  year: number | null; // null when unknown
  relation: string;
  notes: string;
}

export interface UpcomingBirthday extends Person {
  daysUntil: number; // 0 means today
  nextDate: Date; // local date of the next occurrence
  turning: number | null; // age on the next birthday, null when year unknown
}

export interface ParseResult {
  people: Person[];
  skipped: string[]; // names (or row numbers) that could not be read
}

const DAY_MS = 24 * 60 * 60 * 1000;

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/**
 * Accepted formats (separator can be "-", "/" or "."):
 *   DD-MM-YYYY  day first, e.g. 14-03-1995
 *   YYYY-MM-DD  year first, e.g. 1995-03-14
 *   DD-MM       no year, e.g. 14-03
 * Use 0000 as the year when it is unknown.
 * Returns null for anything else, so a typo never shows a wrong date.
 */
export function parseBirthDate(
  raw: string,
): { year: number | null; month: number; day: number } | null {
  const s = raw.trim();
  let y: number | null;
  let month: number;
  let day: number;
  let m: RegExpExecArray | null;
  if ((m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s))) {
    y = Number(m[1]);
    month = Number(m[2]);
    day = Number(m[3]);
  } else if ((m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(s))) {
    day = Number(m[1]);
    month = Number(m[2]);
    y = Number(m[3]);
  } else if ((m = /^(\d{1,2})[-/.](\d{1,2})$/.exec(s))) {
    day = Number(m[1]);
    month = Number(m[2]);
    y = null;
  } else {
    return null;
  }
  const year = y === 0 ? null : y;
  if (month < 1 || month > 12 || day < 1) return null;
  // Validate against a leap year when the year is unknown so 29 Feb is allowed.
  const checkYear = year ?? 2000;
  if (day > daysInMonth(checkYear, month)) return null;
  return { year, month, day };
}

export function parsePeople(csvText: string): ParseResult {
  const people: Person[] = [];
  const skipped: string[] = [];
  csvToRecords(csvText).forEach((rec, idx) => {
    const name = rec["name"] ?? "";
    const date = parseBirthDate(rec["birth_date"] ?? "");
    if (!name || !date) {
      skipped.push(name || `row ${idx + 2}`);
      return;
    }
    people.push({
      id: `${idx}-${name}`,
      name,
      ...date,
      relation: rec["relation"] ?? "",
      notes: rec["notes"] ?? "",
    });
  });
  return { people, skipped };
}

/** The day of the birthday in a given year. 29 Feb falls on 28 Feb in non leap years. */
function birthdayDayInYear(p: Person, year: number): number {
  if (p.month === 2 && p.day === 29 && !isLeapYear(year)) return 28;
  return p.day;
}

export function nextBirthday(p: Person, today: Date): UpcomingBirthday {
  const ty = today.getFullYear();
  const todayUtc = Date.UTC(ty, today.getMonth(), today.getDate());

  let year = ty;
  let utc = Date.UTC(year, p.month - 1, birthdayDayInYear(p, year));
  if (utc < todayUtc) {
    year += 1;
    utc = Date.UTC(year, p.month - 1, birthdayDayInYear(p, year));
  }
  const day = birthdayDayInYear(p, year);
  return {
    ...p,
    daysUntil: Math.round((utc - todayUtc) / DAY_MS),
    nextDate: new Date(year, p.month - 1, day),
    turning: p.year !== null ? year - p.year : null,
  };
}

export function sortByNext(people: Person[], today: Date): UpcomingBirthday[] {
  return people
    .map((p) => nextBirthday(p, today))
    .sort((a, b) => a.daysUntil - b.daysUntil || a.name.localeCompare(b.name));
}

export interface MonthGroups {
  thisMonth: UpcomingBirthday[];
  nextMonth: UpcomingBirthday[];
  later: UpcomingBirthday[];
}

/**
 * Splits birthdays (already sorted by next occurrence) into the rest of this
 * calendar month, next calendar month, and everything after. Birthdays earlier
 * this month have already passed, so they fall into "later" (next year).
 */
export function groupByMonth(items: UpcomingBirthday[], today: Date): MonthGroups {
  const y = today.getFullYear();
  const m = today.getMonth();
  const nextY = m === 11 ? y + 1 : y;
  const nextM = (m + 1) % 12;
  const groups: MonthGroups = { thisMonth: [], nextMonth: [], later: [] };
  for (const b of items) {
    const by = b.nextDate.getFullYear();
    const bm = b.nextDate.getMonth();
    if (by === y && bm === m) groups.thisMonth.push(b);
    else if (by === nextY && bm === nextM) groups.nextMonth.push(b);
    else groups.later.push(b);
  }
  return groups;
}
