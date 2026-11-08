import type { UpcomingBirthday } from "../lib/birthdays";

const dateFmt = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "long" });
const weekdayFmt = new Intl.DateTimeFormat(undefined, { weekday: "short" });

function whenLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function BirthdayCard({ b }: { b: UpcomingBirthday }) {
  const isToday = b.daysUntil === 0;
  return (
    <li className={isToday ? "card card-today" : "card"}>
      <div className="avatar" aria-hidden="true">
        {initials(b.name)}
      </div>
      <div className="card-body">
        <div className="card-top">
          <span className="name">{b.name}</span>
          <span className={isToday ? "when when-today" : "when"}>{whenLabel(b.daysUntil)}</span>
        </div>
        <div className="meta">
          {weekdayFmt.format(b.nextDate)}, {dateFmt.format(b.nextDate)}
          {b.turning !== null && <> · turns {b.turning}</>}
          {b.relation && <> · {b.relation}</>}
        </div>
        {b.notes && <div className="notes">{b.notes}</div>}
      </div>
    </li>
  );
}
