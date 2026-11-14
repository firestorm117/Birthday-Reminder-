/**
 * Where the birthday list comes from. Set these in Netlify under
 * Project configuration > Environment variables, then redeploy:
 *
 *   VITE_SHEET_CSV_URL   Google Sheets "Publish to web" link, format CSV
 *   VITE_SHEET_EDIT_URL  the normal link to the sheet (enables Add and Edit)
 *   APP_PASSWORD         password needed to open the app
 *
 * With APP_PASSWORD set, the links are encrypted at build time and never
 * appear in plain text in the site's code. Without a CSV link the app shows
 * sample data.
 */
export const SHEET_CONFIG = __SHEET_CONFIG__;

export const SAMPLE_CSV_URL = "/sample.csv";

/** Link that opens the sheet at a given row, or null when no edit link is set. */
export function sheetRowLink(editUrl: string, csvUrl: string, row: number): string | null {
  if (!editUrl) return null;
  let gid = "0";
  try {
    gid = new URL(csvUrl, "https://example.invalid").searchParams.get("gid") ?? "0";
  } catch {
    // keep the default tab
  }
  const base = editUrl.split("#")[0]!.split("?")[0]!;
  return `${base}#gid=${gid}&range=A${row}`;
}
