/**
 * Password lock for a static site.
 *
 * At build time the sheet links are encrypted with a key derived from the
 * password (PBKDF2, then AES-GCM). Only the encrypted blob is shipped, so the
 * links cannot be read from the site's code without the password.
 *
 * Works in the browser and in Node (used by vite.config.ts during the build).
 */

export interface SheetConfig {
  csvUrl: string;
  editUrl: string;
}

export interface LockedBlob {
  iv: string; // base64
  data: string; // base64 ciphertext
}

// A fixed, app specific salt keeps the derived key the same across deploys,
// so a remembered device stays unlocked until the password itself changes.
const SALT = "birthday-book/sheet-lock/v1";
const ITERATIONS = 310_000;

const enc = new TextEncoder();
const dec = new TextDecoder();

function toB64(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin);
}

function fromB64(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

/** Derives the AES key from a password and returns it as base64 (safe to remember on a device). */
export async function keyFromPassword(password: string): Promise<string> {
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: enc.encode(SALT), iterations: ITERATIONS },
    base,
    256,
  );
  return toB64(bits);
}

function importAesKey(keyB64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", fromB64(keyB64), "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptConfig(password: string, cfg: SheetConfig): Promise<LockedBlob> {
  const key = await importAesKey(await keyFromPassword(password));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(JSON.stringify(cfg)),
  );
  return { iv: toB64(iv), data: toB64(data) };
}

/** Returns the sheet links, or null when the key is wrong. */
export async function decryptConfig(keyB64: string, blob: LockedBlob): Promise<SheetConfig | null> {
  try {
    const key = await importAesKey(keyB64);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromB64(blob.iv) },
      key,
      fromB64(blob.data),
    );
    return JSON.parse(dec.decode(plain)) as SheetConfig;
  } catch {
    return null;
  }
}
