import { useMemo, useRef, useState } from "react";
import type { Person, UpcomingBirthday } from "../lib/birthdays";
import { birthdaysInMonth, daysFromToday, monthGrid } from "../lib/calendar";
import { BirthdayRow } from "./BirthdayRow";

const monthYearFmt = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });
const dayTitleFmt = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" });
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

function tone(days: number): string {
  if (days >= 0 && days < 7) return " d-soon";
  if (days >= 7 && days < 30) return " d-near";
  return "";
}

export function CalendarView({
  people,
  sorted,
  today,
  editHref,
}: {
  people: Person[];
  sorted: UpcomingBirthday[];
  today: Date;
  editHref: (b: UpcomingBirthday) => string | null;
}) {
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected, setSelected] = useState<number | null>(today.getDate());
  const touchX = useRef<number | null>(null);

  const cells = useMemo(() => monthGrid(view.year, view.month), [view]);
  const byDay = useMemo(() => birthdaysInMonth(people, view.year, view.month), [people, view]);
  const upcomingById = useMemo(() => new Map(sorted.map((b) => [b.id, b])), [sorted]);

  const isCurrentMonth = view.year === today.getFullYear() && view.month === today.getMonth();

  function shift(delta: number) {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
    setSelected(null);
  }

  function goToday() {
    setView({ year: today.getFullYear(), month: today.getMonth() });
    setSelected(today.getDate());
  }

  const selectedPeople = selected !== null ? (byDay.get(selected) ?? []) : [];
  const selectedRows = selectedPeople
    .map((p) => upcomingById.get(p.id))
    .filter((b): b is UpcomingBirthday => b !== undefined);

  return (
    <div>
      <div
        className="cal"
        onTouchStart={(e) => {
          touchX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchX.current;
          const end = e.changedTouches[0]?.clientX;
          touchX.current = null;
          if (start === null || end === undefined) return;
          if (Math.abs(end - start) > 50) shift(end < start ? 1 : -1);
        }}
      >
        <div className="cal-head">
          <button type="button" className="cal-nav" onClick={() => shift(-1)} aria-label="Previous month">
            &lt;
          </button>
          <span className="cal-title">{monthYearFmt.format(new Date(view.year, view.month, 1))}</span>
          <button type="button" className="cal-nav" onClick={() => shift(1)} aria-label="Next month">
            &gt;
          </button>
        </div>
        <div className="cal-grid" role="grid">
          {WEEKDAYS.map((w, i) => (
            <div key={i} className="cal-dow" aria-hidden="true">
              {w}
            </div>
          ))}
          {cells.map((c) => {
            if (!c.inMonth) {
              return (
                <div key={`${c.month}-${c.day}`} className="d d-dim" aria-hidden="true">
                  {c.day}
                </div>
              );
            }
            const count = byDay.get(c.day)?.length ?? 0;
            const days = daysFromToday(today, c.year, c.month, c.day);
            let cls = "d";
            if (count > 0) cls += " d-has" + tone(days);
            if (days === 0) cls += " d-today";
            if (selected === c.day) cls += " d-sel";
            return (
              <button
                key={c.day}
                type="button"
                className={cls}
                onClick={() => setSelected(c.day)}
                aria-label={`${c.day}${count ? `, ${count} birthday${count === 1 ? "" : "s"}` : ""}`}
                aria-pressed={selected === c.day}
              >
                {c.day}
                {count > 1 && <span className="d-count">{count}</span>}
              </button>
            );
          })}
        </div>
        {!isCurrentMonth && (
          <button type="button" className="link-btn cal-today" onClick={goToday}>
            Back to today
          </button>
        )}
      </div>

      {selected !== null && (
        <section>
          <h2>
            {dayTitleFmt.format(new Date(view.year, view.month, selected))}{" "}
            {selectedRows.length > 0 && <span className="group-count">{selectedRows.length}</span>}
          </h2>
          {selectedRows.length > 0 ? (
            <ul className="list">
              {selectedRows.map((b) => (
                <BirthdayRow key={b.id} b={b} editHref={editHref(b)} />
              ))}
            </ul>
          ) : (
            <p className="cal-empty">No birthdays on this day.</p>
          )}
        </section>
      )}
    </div>
  );
}
