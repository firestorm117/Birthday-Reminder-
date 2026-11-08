import { useMemo, useState } from "react";
import { BirthdayCard } from "./components/BirthdayCard";
import { SHEET_EDIT_URL, UPCOMING_DAYS, USING_SAMPLE_DATA } from "./config";
import { sortByNext, type UpcomingBirthday } from "./lib/birthdays";
import { useBirthdays } from "./useBirthdays";

function Section({ title, items }: { title: string; items: UpcomingBirthday[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2>
        {title} <span className="count">{items.length}</span>
      </h2>
      <ul className="list">
        {items.map((b) => (
          <BirthdayCard key={b.id} b={b} />
        ))}
      </ul>
    </section>
  );
}

const timeFmt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

export default function App() {
  const { people, skipped, loading, error, offlineSince, refresh } = useBirthdays();
  const [query, setQuery] = useState("");

  // Recomputed on each render, so the day rolls over correctly when the app is reopened.
  const todayKey = new Date().toDateString();
  const sorted = useMemo(() => sortByNext(people, new Date(todayKey)), [people, todayKey]);

  const q = query.trim().toLowerCase();
  const visible = q
    ? sorted.filter((b) => `${b.name} ${b.relation}`.toLowerCase().includes(q))
    : sorted;

  const todays = visible.filter((b) => b.daysUntil === 0);
  const upcoming = visible.filter((b) => b.daysUntil > 0 && b.daysUntil <= UPCOMING_DAYS);
  const later = visible.filter((b) => b.daysUntil > UPCOMING_DAYS);

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Birthday Book</h1>
          <p className="subtitle">
            {people.length} {people.length === 1 ? "person" : "people"}
          </p>
        </div>
        <div className="actions">
          <button type="button" className="btn btn-ghost" onClick={refresh} disabled={loading}>
            {loading ? "Loading" : "Refresh"}
          </button>
          {SHEET_EDIT_URL && (
            <a className="btn" href={SHEET_EDIT_URL} target="_blank" rel="noreferrer">
              Edit
            </a>
          )}
        </div>
      </header>

      {USING_SAMPLE_DATA && (
        <p className="banner">
          Showing sample data. Connect your Google Sheet in <code>src/config.ts</code> or Netlify
          environment variables.
        </p>
      )}
      {offlineSince && (
        <p className="banner">Offline. Showing data saved {timeFmt.format(offlineSince)}.</p>
      )}
      {error && <p className="banner banner-error">Could not load birthdays: {error}</p>}

      <input
        className="search"
        type="search"
        placeholder="Search by name or relation"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search"
      />

      <main>
        <Section title="Today" items={todays} />
        <Section title={`Next ${UPCOMING_DAYS} days`} items={upcoming} />
        <Section title="Later" items={later} />
        {!loading && visible.length === 0 && !error && (
          <p className="empty">{q ? "No one matches that search." : "No birthdays yet."}</p>
        )}
        {skipped.length > 0 && (
          <p className="skipped">
            Skipped {skipped.length} row{skipped.length === 1 ? "" : "s"} with a missing name or a
            date not in YYYY-MM-DD form: {skipped.join(", ")}
          </p>
        )}
      </main>
    </div>
  );
}
