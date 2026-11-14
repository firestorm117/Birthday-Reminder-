import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { encryptConfig } from "./src/lib/lock.ts";

async function sheetConfig(mode: string) {
  // Reads .env files and the real environment (Netlify sets the latter).
  const env = loadEnv(mode, process.cwd(), "");
  const csvUrl = env.VITE_SHEET_CSV_URL || "/sample.csv";
  const editUrl = env.VITE_SHEET_EDIT_URL || "";
  const password = env.APP_PASSWORD || "";
  if (password) {
    return { mode: "locked" as const, blob: await encryptConfig(password, { csvUrl, editUrl }) };
  }
  if (env.VITE_SHEET_CSV_URL) {
    console.warn("APP_PASSWORD is not set: the site is open to anyone with its address.");
  }
  return { mode: "open" as const, csvUrl, editUrl };
}

export default defineConfig(async ({ mode }) => ({
  define: {
    __SHEET_CONFIG__: JSON.stringify(await sheetConfig(mode)),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/apple-touch-icon.png", "sample.csv"],
      manifest: {
        name: "Birthday Book",
        short_name: "Birthdays",
        description: "Birthdays of the people who matter, at a glance.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#FFF8F6",
        theme_color: "#E8505B",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,csv}"],
      },
    }),
  ],
}));
