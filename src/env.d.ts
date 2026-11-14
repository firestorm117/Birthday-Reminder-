import type { LockedBlob } from "./lib/lock";

declare global {
  /** Injected by vite.config.ts at build time. */
  const __SHEET_CONFIG__:
    | { mode: "open"; csvUrl: string; editUrl: string }
    | { mode: "locked"; blob: LockedBlob };
}

export {};
