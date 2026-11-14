/**
 * Minimal RFC 4180 CSV parser. Handles quoted fields, escaped quotes ("")
 * and commas or newlines inside quotes. Good enough for Google Sheets output.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/^﻿/, "");

  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function isBlank(row: string[]): boolean {
  return row.every((cell) => cell.trim() === "");
}

export interface CsvRecord {
  /** 1 based row number in the sheet (the header is row 1). */
  row: number;
  values: Record<string, string>;
}

/**
 * Turns CSV rows into objects keyed by the lowercased header names.
 * Blank rows are skipped but still counted, so `row` matches the sheet.
 */
export function csvToRecords(text: string): { records: CsvRecord[]; lastRow: number } {
  const rows = parseCsv(text);
  while (rows.length > 0 && isBlank(rows[rows.length - 1]!)) rows.pop();
  const [header, ...body] = rows;
  if (!header) return { records: [], lastRow: 0 };
  const keys = header.map((h) => h.trim().toLowerCase());
  const records: CsvRecord[] = [];
  body.forEach((cells, idx) => {
    if (isBlank(cells)) return;
    const values: Record<string, string> = {};
    keys.forEach((k, i) => {
      values[k] = (cells[i] ?? "").trim();
    });
    records.push({ row: idx + 2, values });
  });
  return { records, lastRow: rows.length };
}
