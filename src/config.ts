/**
 * Where the birthday list comes from.
 *
 * SHEET_CSV_URL: the link from Google Sheets "File > Share > Publish to web"
 * with the format set to CSV. Until you set it, the app shows sample data.
 *
 * SHEET_EDIT_URL: the normal link to your sheet. The "Edit" button opens it.
 *
 * You can paste the links below, or set VITE_SHEET_CSV_URL and
 * VITE_SHEET_EDIT_URL as environment variables in Netlify.
 */
export const SHEET_CSV_URL: string =
  import.meta.env.VITE_SHEET_CSV_URL || "/sample.csv";

export const SHEET_EDIT_URL: string = import.meta.env.VITE_SHEET_EDIT_URL || "";

export const UPCOMING_DAYS = 30;

export const USING_SAMPLE_DATA = SHEET_CSV_URL === "/sample.csv";
