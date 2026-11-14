# Birthday Book

Live at **https://impbirthdays.netlify.app**

A personal birthday list that installs on Android like an app. Built with React, TypeScript and Vite as a static Progressive Web App. Data lives in a Google Sheet, so there is no server.

## 1. Set up the Google Sheet

1. Create a Google Sheet with these headers in row 1:

   | name | birth_date | relation | notes |
   |-|-|-|-|
   | Asha Sharma | 14-03-1995 | Friend | Likes books |
   | Ravi Kumar | 21-11-0000 | Colleague | Year unknown |

2. **Important:** select column B, then Format > Number > Plain text. Otherwise Google may reformat the dates. Type dates **day first** as `DD-MM-YYYY` (for example `14-03-1995`); `/` or `.` also work, and so does `YYYY-MM-DD`. Use `0000` as the year if you do not know it. Month first (US style) dates are not supported.
3. File > Share > Publish to web. Choose the sheet tab, choose **Comma separated values (.csv)**, click Publish and copy the link.
4. Anyone with that link can read the sheet. Keep it to names and dates; do not add phone numbers or addresses.

## 2. Connect the sheet and set a password

In Netlify, open the project, then Project configuration > Environment variables, and add:

* `VITE_SHEET_CSV_URL`: the Publish to web CSV link
* `VITE_SHEET_EDIT_URL`: the normal sheet link (turns on **+ Add** and tap to edit)
* `APP_PASSWORD`: the password needed to open the app

Trigger a redeploy after any change (Deploys > Trigger deploy > Deploy site). Until the CSV link is set, the app shows sample data.

Keep the sheet's own sharing set to **Restricted**. Publish to web is separate and keeps working.

### How the password works

During the build, the two sheet links are encrypted with a key derived from `APP_PASSWORD` (PBKDF2 and AES-GCM). The site only ships the encrypted blob, so without the password nobody can find out where your data lives. "Remember on this device" stores the derived key in the browser, so you type the password once per device. Changing `APP_PASSWORD` and redeploying logs every device out. "Lock this device" at the bottom of the list forgets the key and the saved data on that device.

Limits: anyone who already knows the published CSV link can read it directly, with or without the password. Choose a password that is not easy to guess, because someone could copy the encrypted blob and try passwords offline.

## 3. Deploy on Netlify

1. In Netlify, Add new site > Import an existing project > pick this GitHub repo.
2. Netlify reads `netlify.toml`: build command `npm run build`, publish directory `dist`.
3. Every push to the main branch redeploys. Changes to the sheet do **not** need a redeploy.

## 4. Install on Android

Open the Netlify URL in Chrome, tap the menu, then "Install app" (or "Add to Home screen").

## Daily use

Tap **+ Add** to open the sheet at the next empty row, or tap a person to open their row. The app reloads the data when it opens, when you come back to it, when the network returns and every 5 minutes while open. Google can take up to about 5 minutes to update the published CSV, so a change may not show instantly. Offline, it shows the last copy it saved.

## Development

```
npm install
npm run dev      # local dev server
npm test         # unit tests for date logic and CSV parsing
npm run build    # type check and production build into dist/
```

`scripts/make-icons.mjs` regenerates the PNG icons from `public/favicon.svg` (needs Playwright).
