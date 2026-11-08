# Birthday Reminder: Project Plan

## 1. Goal

A personal web app that lists the birthdays of important people, highlights upcoming ones, and can be installed on an Android phone from Chrome like a native app (a Progressive Web App, or PWA). No server of our own. Hosted on Netlify.

## 2. Key decisions

### 2.1 App type: static PWA

* React with TypeScript, bundled by Vite. Netlify runs the build (`npm run build`) on each push.
* `vite-plugin-pwa` generates the service worker and precaches the hashed build files.
* A `manifest.webmanifest` plus a service worker makes Chrome on Android offer "Install app" / "Add to Home screen". The app then opens full screen with its own icon and works offline.
* Netlify serves the files as a static site. Every `git push` to the main branch redeploys automatically.

### 2.2 Data storage: why not a plain Excel file

Excel is a reasonable instinct but a poor fit here, for a concrete reason: a static website cannot write to an `.xlsx` file. If the data lives in an Excel file inside the site, every change means editing the file on a computer, committing it and waiting for a redeploy. That is clumsy, especially from a phone.

Options compared:

| Option | Edit from phone | Same data on all devices | Needs a server | Effort |
|-|-|-|-|-|
| Excel/CSV file in the repo | Poor (edit file, push, redeploy) | Yes | No | Low |
| Browser storage only (IndexedDB) | Good, inside the app | No, each device has its own copy | No | Low |
| **Google Sheet published as CSV** | **Good, via the Google Sheets app** | **Yes** | **No (Google hosts it)** | **Low** |
| Hosted database (Firebase, Supabase) | Good, inside the app | Yes | Third party backend, needs auth | Medium/High |

**Recommendation: Google Sheet as the source of truth.**

* It is a spreadsheet, so it gives you the "Excel" experience you asked for, and it can be exported to `.xlsx` any time.
* You add or edit people in the Google Sheets app on your phone or in a browser. The website picks up changes on the next load (Google refreshes published CSVs within about 5 minutes).
* The site reads the sheet through "File > Share > Publish to web > CSV". No API key, no server.
* The app saves the last loaded copy in browser storage, so it still works offline.

**Trade off you should accept knowingly:** a published sheet is readable by anyone who has the link. Names and birthdays are low sensitivity, but do not put phone numbers or addresses in it. If that is unacceptable, fall back to the browser storage option with Excel/CSV import and export for backups.

### 2.3 Sheet layout

One row per person:

| name | birth_date | relation | notes |
|-|-|-|-|
| Asha Sharma | 1995-03-14 | Friend | Likes books |
| Ravi Kumar | 0000-11-21 | Colleague | Year unknown |

* `birth_date` uses `YYYY-MM-DD`. Use `0000` as the year when unknown; the app then skips the age.
* Column names are fixed so the parser stays simple.

### 2.4 Reminders: an honest limitation

A serverless PWA cannot reliably send notifications while the app is closed. Real push notifications need a server to send them. Chrome's Periodic Background Sync exists but fires on Chrome's own schedule and is not dependable for "notify me on the day".

What we will do instead:

1. When you open the app, it shows "Today" and "Next 30 days" at the top, and fires a local notification if someone has a birthday today.
2. Optional: an "Add to Google Calendar" link per person (a yearly recurring event). Google Calendar then handles reliable reminders with no server on our side. This is the dependable route.

If later you want true push reminders, the smallest step is a Netlify Scheduled Function plus Web Push. That is a serverless function, not a server you manage, but it is extra work and out of scope for version 1.

## 3. Features

### Version 1 (MVP)
* Load birthdays from the published Google Sheet CSV.
* Sections: Today, Upcoming (next 30 days), All (sorted by next occurrence).
* Each card: name, date, days remaining, age they are turning, relation.
* Search by name.
* Installable on Android, works offline with the last cached data.
* "Open sheet to edit" button that opens the Google Sheet.

### Version 2
* Notification on app open for today's birthdays.
* "Add to Google Calendar" link per person.
* Filter by relation.
* Light and dark theme.

### Later, if needed
* Push reminders through Netlify Scheduled Functions.
* Photos per person.

## 4. File structure

```
/
  index.html                  HTML entry
  src/main.tsx                React entry, registers the service worker
  src/App.tsx                 Layout: header, search, Today / Next 30 days / Later
  src/components/BirthdayCard.tsx
  src/useBirthdays.ts         Fetch the CSV, offline fallback, refresh on resume
  src/lib/csv.ts              CSV parser
  src/lib/birthdays.ts        Date parsing, next birthday, age, sorting
  src/lib/birthdays.test.ts   Unit tests (Vitest)
  src/config.ts               Sheet links (or Netlify env variables)
  src/styles.css              Styles, light and dark
  public/                     favicon, PWA icons, sample.csv
  vite.config.ts              Vite + PWA manifest
  netlify.toml                Build settings and headers
```

## 5. Implementation steps

1. **Set up the Google Sheet.** Create the sheet with the columns above, add a few people, then File > Share > Publish to web, pick the sheet, format CSV. Copy that URL.
2. **Build the app shell.** `index.html`, `styles.css`, mobile first layout.
3. **Data logic in `app.js`.**
   * Fetch the CSV, parse it (a small parser that handles quoted fields).
   * For each person, compute the next occurrence of the birthday. Handle 29 February (treat as 28 February in non leap years).
   * Compute days remaining and the age they will turn.
   * Sort and render the sections.
4. **PWA.** Add the manifest and icons, register the service worker. Strategy: cache the app files on install; for the CSV use "network first, fall back to cache" so you get fresh data when online and the last copy offline.
5. **Netlify.** Connect the GitHub repo in Netlify, no build command, publish directory is the repo root. Add `netlify.toml` so `sw.js` is never cached by the browser (otherwise updates get stuck).
6. **Test on Android.** Open the Netlify URL in Chrome, use "Install app", check offline mode by enabling airplane mode.
7. **Version 2 features** after the MVP is in daily use.

## 6. Daily workflow once built

1. Open the Google Sheets app, add or edit a row.
2. Open the Birthday app on your phone. Within a few minutes it shows the change.
3. No redeploy needed for data changes. Redeploys happen only when the app's code changes.

## 7. Decisions made

1. Storage: Google Sheet published as CSV.
2. Name: Birthday Book. Accent color: coral `#E8505B`. Icon: a two tier cake.
3. Google Calendar link: not in version 1.
4. Stack: React and TypeScript.
