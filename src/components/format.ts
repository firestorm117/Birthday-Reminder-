import type { UpcomingBirthday } from "../lib/birthdays";

const dateFmt = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "long" });
const weekdayFmt = new Intl.DateTimeFormat(undefined, { weekday: "short" });

export function dateLabel(b: UpcomingBirthday): string {
  return `${weekdayFmt.format(b.nextDate)}, ${dateFmt.format(b.nextDate)}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}
