import { useEffect, useMemo, useState } from "react";
import { BirthdayRow } from "./components/BirthdayRow";
import { LockScreen } from "./components/LockScreen";
import { NextUp } from "./components/NextUp";
import { SAMPLE_CSV_URL, SHEET_CONFIG, sheetRowLink } from "./config";
import { groupForDisplay, sortByNext, type UpcomingBirthday } from "./lib/birthdays";
import { decryptConfig, type SheetConfig } from "./lib/lock";
import { CSV_STORAGE_KEY, useBirthdays } from "./useBirthdays";

const KEY_STORAGE_KEY = "birthday-book:key";

function readKey(): string | null {
  try {
    return localStorage.getItem(KEY_STORAGE_KEY);
  } catch {
    return null;
  }
}

function forgetDevice(): void {
  try {
    localStorage.removeItem(KEY_STORAGE_KEY);
    localStorage.removeItem(CSV_STORAGE_KEY);
  } catch {
    // nothing stored
  }
}

/** Decides between the lock screen and the list. */
export default function App() {
  const cfg = SHEET_CONFIG;
  const [sheet, setSheet] = useState<SheetConfig | null>(
    cfg.mode === "open" ? { csvUrl: cfg.csvUrl, editUrl: cfg.editUrl } : null,
  );
  const [checking, setChecking] = useState(cfg.mode === "locked");

  useEffect(() => {
    if (cfg.mode !== "locked") return;
    const key = readKey();
    if (!key) {
      setChecking(false);
      return;
    }
    void decryptConfig(key, cfg.blob).then((s) => {
      // A failed decrypt means the password changed: ask again.
      if (s) setSheet(s);
      else forgetDevice();
      setChecking(false);
    });
  }, [cfg]);

  if (checking) return <div className="app" />;

  if (!sheet && cfg.mode === "locked") {
    return (
      <LockScreen
        blob={cfg.blob}
        onUnlock={(s, key, remember) => {
          if (remember) {
            try {
              localStorage.setItem(KEY_STORAGE_KEY, key);
            } catch {
              // cannot remember, still unlock for this visit
            }
          }
          setSheet(s);
        }}
      />
    );
  }

  return (
    <BirthdayList
      sheet={sheet!}
      locked={cfg.mode === "locked"}
      onLock={() => {
        forgetDevice();
        setSheet(null);
      }}
    />
  );
}

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const dayFmt = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

function updatedLabel(d: Date): string {
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay ? timeFmt.format(d) : `${dayFmt.format(d)}, ${timeFmt.format(d)}`;
}

function BirthdayList({
  sheet,
  locked,
  onLock,
}: {
  sheet: SheetConfig;
  locked: boolean;
  onLock: () => void;
}) {
  const { people, skipped, lastRow, loading, error, updatedAt, offline } = useBirthdays(
    sheet.csvUrl,
  );
  const [query, setQuery] = useState("");
  const usingSample = sheet.csvUrl === SAMPLE_CSV_URL;

  // Recomputed each render, so the day rolls over when the app is reopened.
  const todayKey = new Date().toDateString();
  const sorted = useMemo(() => sortByNext(people, new Date(todayKey)), [people, todayKey]);

  const editHref = (b: UpcomingBirthday) => sheetRowLink(sheet.editUrl, sheet.csvUrl, b.row);
  const addHref = sheetRowLink(sheet.editUrl, sheet.csvUrl, lastRow + 1);

  const q = query.trim().toLowerCase();
  const searching = q !== "";
  const visible = searching
    ? sorted.filter((b) => `${b.name} ${b.relation}`.toLowerCase().includes(q))
    : sorted;

  // The nearest birthday (and anyone sharing that day) gets the big card.
  const nextUp = searching ? [] : visible.filter((b) => b.daysUntil === visible[0]?.daysUntil);
  const rest = searching ? visible : visible.slice(nextUp.length);
  const groups = groupForDisplay(rest, new Date(todayKey));

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Birthday Book</h1>
          <p className="subtitle">
            {people.length} {people.length === 1 ? "person" : "people"}
          </p>
        </div>
        {addHref && (
          <a className="btn" href={addHref} target="_blank" rel="noreferrer">
            + Add
          </a>
        )}
      </header>

      {usingSample && (
        <p className="banner">
          Showing sample data. Set VITE_SHEET_CSV_URL in Netlify to load your sheet.
        </p>
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
        <NextUp items={nextUp} editHref={editHref} />
        {groups.map((g) => (
          <section key={g.key}>
            <h2>
              {g.title} <span className="group-count">{g.items.length}</span>
            </h2>
            <ul className="list">
              {g.items.map((b) => (
                <BirthdayRow key={b.id} b={b} editHref={editHref(b)} />
              ))}
            </ul>
          </section>
        ))}
        {!loading && visible.length === 0 && !error && (
          <p className="empty">{searching ? "No one matches that search." : "No birthdays yet."}</p>
        )}
        {skipped.length > 0 && (
          <p className="skipped">
            Skipped {skipped.length} row{skipped.length === 1 ? "" : "s"} with a missing name or a
            date not in DD-MM-YYYY form: {skipped.join(", ")}
          </p>
        )}
      </main>

      <footer className="footer">
        {updatedAt && (
          <span>
            {offline ? "Offline · saved " : "Updated "}
            {updatedLabel(updatedAt)}
          </span>
        )}
        {addHref && people.length > 0 && <span>Tap a person to edit them in the sheet.</span>}
        {locked && (
          <button type="button" className="link-btn" onClick={onLock}>
            Lock this device
          </button>
        )}
      </footer>
    </div>
  );
}
