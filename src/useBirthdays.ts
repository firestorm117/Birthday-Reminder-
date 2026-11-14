import { useCallback, useEffect, useRef, useState } from "react";
import { parsePeople, type Person } from "./lib/birthdays";

export const CSV_STORAGE_KEY = "birthday-book:last-csv";
const AUTO_REFRESH_MS = 5 * 60 * 1000;

interface Saved {
  csv: string;
  savedAt: number;
}

export interface BirthdaysState {
  people: Person[];
  skipped: string[];
  lastRow: number;
  loading: boolean;
  error: string | null;
  /** When the data shown was last fetched successfully. */
  updatedAt: Date | null;
  /** True when the last fetch failed and saved data is shown. */
  offline: boolean;
}

function readSaved(): Saved | null {
  try {
    const raw = localStorage.getItem(CSV_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

function writeSaved(csv: string): void {
  try {
    localStorage.setItem(CSV_STORAGE_KEY, JSON.stringify({ csv, savedAt: Date.now() }));
  } catch {
    // Storage can be unavailable (private mode). The app still works online.
  }
}

/**
 * Loads the sheet on open, whenever the app comes back to the foreground or
 * the network returns, and every few minutes while it stays open.
 */
export function useBirthdays(csvUrl: string | null): BirthdaysState {
  const saved = csvUrl ? readSaved() : null;
  const [csv, setCsv] = useState<string | null>(saved?.csv ?? null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(
    saved ? new Date(saved.savedAt) : null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (!csvUrl || inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      const res = await fetch(csvUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (/^\s*<(!doctype|html)/i.test(text)) {
        throw new Error("The sheet link returned a web page, not CSV. Check the Publish to web format.");
      }
      setCsv(text);
      writeSaved(text);
      setUpdatedAt(new Date());
      setError(null);
      setOffline(false);
    } catch (e) {
      if (readSaved()) {
        setOffline(true);
        setError(null);
      } else {
        setError(e instanceof Error ? e.message : "Could not load birthdays.");
      }
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [csvUrl]);

  useEffect(() => {
    if (!csvUrl) return;
    void load();
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    const onOnline = () => void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, AUTO_REFRESH_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
      window.clearInterval(timer);
    };
  }, [csvUrl, load]);

  const parsed = csv ? parsePeople(csv) : { people: [], skipped: [], lastRow: 1 };
  return { ...parsed, loading, error, updatedAt, offline };
}
