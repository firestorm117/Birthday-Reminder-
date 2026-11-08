import { useCallback, useEffect, useState } from "react";
import { SHEET_CSV_URL } from "./config";
import { parsePeople, type Person } from "./lib/birthdays";

const STORAGE_KEY = "birthday-book:last-csv";

interface Saved {
  csv: string;
  savedAt: number;
}

export interface BirthdaysState {
  people: Person[];
  skipped: string[];
  loading: boolean;
  error: string | null;
  /** Set when we are showing a saved copy because the network failed. */
  offlineSince: Date | null;
  refresh: () => void;
}

function readSaved(): Saved | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

function writeSaved(csv: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ csv, savedAt: Date.now() }));
  } catch {
    // Storage can be unavailable (private mode). The app still works online.
  }
}

export function useBirthdays(): BirthdaysState {
  const [csv, setCsv] = useState<string | null>(() => readSaved()?.csv ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offlineSince, setOfflineSince] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(SHEET_CSV_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (/^\s*<(!doctype|html)/i.test(text)) {
        throw new Error("The sheet link returned a web page, not CSV. Check the Publish to web format.");
      }
      setCsv(text);
      writeSaved(text);
      setError(null);
      setOfflineSince(null);
    } catch (e) {
      const saved = readSaved();
      if (saved) {
        setCsv(saved.csv);
        setOfflineSince(new Date(saved.savedAt));
        setError(null);
      } else {
        setError(e instanceof Error ? e.message : "Could not load birthdays.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  const parsed = csv ? parsePeople(csv) : { people: [], skipped: [] };
  return { ...parsed, loading, error, offlineSince, refresh: () => void load() };
}
