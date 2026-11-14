import type { UpcomingBirthday } from "../lib/birthdays";
import { Countdown } from "./Countdown";
import { dateLabel, initials } from "./format";

export function BirthdayRow({ b, editHref }: { b: UpcomingBirthday; editHref: string | null }) {
  const content = (
    <>
      <div className="avatar" aria-hidden="true">
        {initials(b.name)}
      </div>
      <div className="row-body">
        <div className="name">{b.name}</div>
        <div className="meta">
          {dateLabel(b)}
          {b.turning !== null && <> · turns {b.turning}</>}
          {b.relation && <> · {b.relation}</>}
        </div>
        {b.notes && <div className="notes">{b.notes}</div>}
      </div>
      <Countdown days={b.daysUntil} />
    </>
  );
  return (
    <li>
      {editHref ? (
        <a
          className="row row-link"
          href={editHref}
          target="_blank"
          rel="noreferrer"
          aria-label={`${b.name}, ${dateLabel(b)}. Tap to edit in the sheet.`}
        >
          {content}
        </a>
      ) : (
        <div className="row">{content}</div>
      )}
    </li>
  );
}
