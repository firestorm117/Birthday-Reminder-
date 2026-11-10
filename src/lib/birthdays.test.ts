import { describe, expect, it } from "vitest";
import { groupByMonth, nextBirthday, parseBirthDate, parsePeople, sortByNext } from "./birthdays";
import { parseCsv } from "./csv";

describe("parseCsv", () => {
  it("handles quotes, commas and CRLF", () => {
    const rows = parseCsv('name,notes\r\n"Doe, Jane","says ""hi"""\r\n\r\n');
    expect(rows).toEqual([
      ["name", "notes"],
      ["Doe, Jane", 'says "hi"'],
    ]);
  });
});

describe("parseBirthDate", () => {
  it("reads ISO dates and unknown years", () => {
    expect(parseBirthDate("1995-03-14")).toEqual({ year: 1995, month: 3, day: 14 });
    expect(parseBirthDate("0000-11-21")).toEqual({ year: null, month: 11, day: 21 });
    expect(parseBirthDate("21-11")).toEqual({ year: null, month: 11, day: 21 });
  });
  it("reads day first dates with any separator", () => {
    expect(parseBirthDate("14-03-1995")).toEqual({ year: 1995, month: 3, day: 14 });
    expect(parseBirthDate("14/03/1995")).toEqual({ year: 1995, month: 3, day: 14 });
    expect(parseBirthDate("4.3.1995")).toEqual({ year: 1995, month: 3, day: 4 });
    expect(parseBirthDate("21-11-0000")).toEqual({ year: null, month: 11, day: 21 });
    expect(parseBirthDate("29-02-2000")).toEqual({ year: 2000, month: 2, day: 29 });
  });
  it("rejects invalid or ambiguous dates", () => {
    expect(parseBirthDate("2001-02-29")).toBeNull();
    expect(parseBirthDate("03/14/1995")).toBeNull(); // month first is not supported
    expect(parseBirthDate("29-02-2001")).toBeNull();
    expect(parseBirthDate("1995-13-01")).toBeNull();
    expect(parseBirthDate("")).toBeNull();
  });
});

const person = (month: number, day: number, year: number | null = 1990) => ({
  id: "x",
  name: "X",
  month,
  day,
  year,
  relation: "",
  notes: "",
});

describe("nextBirthday", () => {
  const today = new Date(2026, 10, 8); // 8 Nov 2026

  it("is 0 days on the birthday itself", () => {
    const b = nextBirthday(person(11, 8), today);
    expect(b.daysUntil).toBe(0);
    expect(b.turning).toBe(36);
  });

  it("rolls into next year once passed", () => {
    const b = nextBirthday(person(11, 7), today);
    expect(b.daysUntil).toBe(364);
    expect(b.nextDate.getFullYear()).toBe(2027);
    expect(b.turning).toBe(37);
  });

  it("puts 29 Feb on 28 Feb in non leap years", () => {
    const b = nextBirthday(person(2, 29, 2000), today);
    expect(b.nextDate.getMonth()).toBe(1);
    expect(b.nextDate.getDate()).toBe(28);
    expect(b.turning).toBe(27);
  });

  it("uses 29 Feb in leap years", () => {
    const b = nextBirthday(person(2, 29, 2000), new Date(2027, 10, 8));
    expect(b.nextDate.getFullYear()).toBe(2028);
    expect(b.nextDate.getDate()).toBe(29);
  });

  it("leaves age empty when year unknown", () => {
    expect(nextBirthday(person(12, 1, null), today).turning).toBeNull();
  });
});

describe("parsePeople and sortByNext", () => {
  it("skips bad rows and sorts by next occurrence", () => {
    const csv = [
      "Name,Birth_Date,Relation,Notes",
      "Later,1990-01-05,Friend,",
      "Soon,10-11-1990,Family,",
      "Bad,1990/13/01,,",
      ",1990-01-01,,",
    ].join("\n");
    const { people, skipped } = parsePeople(csv);
    expect(skipped).toEqual(["Bad", "row 5"]);
    const sorted = sortByNext(people, new Date(2026, 10, 8));
    expect(sorted.map((p) => p.name)).toEqual(["Soon", "Later"]);
  });
});

describe("groupByMonth", () => {
  const names = (xs: { name: string }[]) => xs.map((x) => x.name);
  const mk = (name: string, month: number, day: number) => ({
    id: name,
    name,
    month,
    day,
    year: 1990,
    relation: "",
    notes: "",
  });

  it("splits into this month, next month and later", () => {
    const today = new Date(2026, 10, 10); // 10 Nov 2026
    const people = [
      mk("TodayP", 11, 10),
      mk("EndNov", 11, 30),
      mk("PassedNov", 11, 3),
      mk("Dec", 12, 1),
      mk("Jan", 1, 5),
    ];
    const g = groupByMonth(sortByNext(people, today), today);
    expect(names(g.thisMonth)).toEqual(["TodayP", "EndNov"]);
    expect(names(g.nextMonth)).toEqual(["Dec"]);
    expect(names(g.later)).toEqual(["Jan", "PassedNov"]);
  });

  it("treats January as next month in December", () => {
    const today = new Date(2026, 11, 20); // 20 Dec 2026
    const people = [mk("LateDec", 12, 25), mk("Jan", 1, 2), mk("Feb", 2, 1)];
    const g = groupByMonth(sortByNext(people, today), today);
    expect(names(g.thisMonth)).toEqual(["LateDec"]);
    expect(names(g.nextMonth)).toEqual(["Jan"]);
    expect(names(g.later)).toEqual(["Feb"]);
  });
});
