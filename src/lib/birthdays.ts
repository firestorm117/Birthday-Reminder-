import { csvToRecords } from "./csv";

export interface Person {
  id: string;
  name: string;
  month: number; // 1 to 12
  day: number; // 1 to 31
  year: number | null; // null when unknown
  relation: string;
  notes: string;
  /** Row number in the Google Sheet, used to open that row for editing. */
  row: number;
}

export interface UpcomingBirthday extends Person {
  daysUntil: number; // 0 means today
  nextDate: Date; // local date of the next occurrence
  turning: number | null; // age on the next birthday, null when year unknown
}

export interface ParseResult {
  people: Person[];
  skipped: string[]; // names (or row numbers) that could not be read
  lastRow: number; // last non blank row in the sheet, so "Add" can open the next one
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

/**
 * Title cases a name: "asha SHARMA" becomes "Asha Sharma".
 * Words with mixed case (like "McDonald") are left alone, since they were
 * typed that way on purpose. Hyphenated and apostrophe parts are capitalised
 * too: "mary-jane o'neil" becomes "Mary-Jane O'Neil".
 */
export function toTitleCase(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => {
      const mixed = word !== word.toLowerCase() && word !== word.toUpperCase();
      if (mixed) return word;
      return word
        .toLowerCase()
        .replace(/(^|[-'\u2019])(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
    })
    .join(" ");
}

export function parsePeople(csvText: string): ParseResult {
  const people: Person[] = [];
  const skipped: string[] = [];
  const { records, lastRow } = csvToRecords(csvText);
  for (const { row, values } of records) {
    const name = toTitleCase(values["name"] ?? "");
    const date = parseBirthDate(values["birth_date"] ?? "");
    if (!name || !date) {
      skipped.push(name || `row ${row}`);
      continue;
    }
    people.push({
      id: `${row}-${name}`,
      name,
      ...date,
      relation: values["relation"] ?? "",
      notes: values["notes"] ?? "",
      row,
    });
  }
  return { people, skipped, lastRow };
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

export interface Group {
  key: string;
  title: string;
  items: UpcomingBirthday[];
}

const monthNameFmt = new Intl.DateTimeFormat(undefined, { month: "long" });

/**
 * Groups birthdays (already sorted by next occurrence) for display:
 * Today, This week (next 6 days), This month (rest of the calendar month),
 * then one group per month. A month gets its year only when it is the
 * current month next year, so "November 2027" is not confused with now.
 * Only groups that have people are returned.
 */
export function groupForDisplay(items: UpcomingBirthday[], today: Date): Group[] {
  const ty = today.getFullYear();
  const tm = today.getMonth();
  const groups: Group[] = [];
  const byKey = new Map<string, Group>();
  for (const b of items) {
    const by = b.nextDate.getFullYear();
    const bm = b.nextDate.getMonth();
    let key: string;
    let title: string;
    if (b.daysUntil === 0) {
      key = "today";
      title = "Today";
    } else if (b.daysUntil < 7) {
      key = "week";
      title = "This week";
    } else if (by === ty && bm === tm) {
      key = "month";
      title = "This month";
    } else {
      key = `${by}-${bm}`;
      title = monthNameFmt.format(b.nextDate) + (bm === tm ? ` ${by}` : "");
    }
    let g = byKey.get(key);
    if (!g) {
      g = { key, title, items: [] };
      byKey.set(key, g);
      groups.push(g);
    }
    g.items.push(b);
  }
  return groups;
}

/** How urgent a countdown is, for colouring. */
export function urgency(daysUntil: number): "soon" | "near" | "far" {
  if (daysUntil < 7) return "soon";
  if (daysUntil < 30) return "near";
  return "far";
}
