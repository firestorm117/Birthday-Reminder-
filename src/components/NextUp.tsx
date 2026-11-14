import type { UpcomingBirthday } from "../lib/birthdays";
import { dateLabel } from "./format";

/** Large card for the nearest birthday (or several, if they share the day). */
export function NextUp({
  items,
  editHref,
}: {
  items: UpcomingBirthday[];
  editHref: (b: UpcomingBirthday) => string | null;
}) {
  const first = items[0];
  if (!first) return null;
  const days = first.daysUntil;
  const single = items.length === 1;
  const href = single ? editHref(first) : null;

  const body = (
    <>
      <div className="hero-text">
        <div className="hero-label">{days === 0 ? "Birthday today" : "Next up"}</div>
        <div className="hero-name">{items.map((b) => b.name).join(" & ")}</div>
        <div className="hero-meta">
          {dateLabel(first)}
          {single && first.turning !== null && <> · turns {first.turning}</>}
          {single && first.relation && <> · {first.relation}</>}
        </div>
      </div>
      <div className="hero-count">
        {days === 0 ? (
          <span className="hero-num hero-word">Today</span>
        ) : (
          <>
            <span className="hero-num">{days}</span>
            <span className="hero-unit">{days === 1 ? "day to go" : "days to go"}</span>
          </>
        )}
      </div>
    </>
  );

  return (
    <section aria-label="Next up">
      {href ? (
        <a className="hero" href={href} target="_blank" rel="noreferrer">
          {body}
        </a>
      ) : (
        <div className="hero">{body}</div>
      )}
    </section>
  );
}
