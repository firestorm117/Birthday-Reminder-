# Birthday Book

A personal birthday list that installs on Android like an app. Built with React, TypeScript and Vite as a static Progressive Web App. Data lives in a Google Sheet, so there is no server.

## 1. Set up the Google Sheet

1. Create a Google Sheet with these headers in row 1:

   | name | birth_date | relation | notes |
   |-|-|-|-|
   | Asha Sharma | 1995-03-14 | Friend | Likes books |
   | Ravi Kumar | 0000-11-21 | Colleague | Year unknown |

2. **Important:** select column B, then Format > Number > Plain text. Otherwise Google turns dates into your local format (for example 14/03/1995) and the app cannot tell day from month. Type dates as `YYYY-MM-DD`. Use `0000` as the year if you do not know it.
3. File > Share > Publish to web. Choose the sheet tab, choose **Comma separated values (.csv)**, click Publish and copy the link.
4. Anyone with that link can read the sheet. Keep it to names and dates; do not add phone numbers or addresses.

## 2. Connect the sheet to the app

Either paste the links into `src/config.ts`, or (better) set them in Netlify under Site configuration > Environment variables:

* `VITE_SHEET_CSV_URL`: the Publish to web CSV link
* `VITE_SHEET_EDIT_URL`: the normal sheet link (shows an "Edit" button in the app)

Trigger a redeploy after adding them. Until the CSV link is set, the app shows sample data.

## 3. Deploy on Netlify

1. In Netlify, Add new site > Import an existing project > pick this GitHub repo.
2. Netlify reads `netlify.toml`: build command `npm run build`, publish directory `dist`.
3. Every push to the main branch redeploys. Changes to the sheet do **not** need a redeploy.

## 4. Install on Android

Open the Netlify URL in Chrome, tap the menu, then "Install app" (or "Add to Home screen").

## Daily use

Add or edit rows in the Google Sheets app. Reopen Birthday Book; it fetches fresh data each time it comes to the foreground (Google can take up to about 5 minutes to update the published CSV). Offline, it shows the last copy it saved.

## Development

```
npm install
npm run dev      # local dev server
npm test         # unit tests for date logic and CSV parsing
npm run build    # type check and production build into dist/
```

`scripts/make-icons.mjs` regenerates the PNG icons from `public/favicon.svg` (needs Playwright).
