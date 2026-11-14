import { useState, type FormEvent } from "react";
import { decryptConfig, keyFromPassword, type LockedBlob, type SheetConfig } from "../lib/lock";

export function LockScreen({
  blob,
  onUnlock,
}: {
  blob: LockedBlob;
  onUnlock: (cfg: SheetConfig, key: string, remember: boolean) => void;
}) {
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [wrong, setWrong] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setWrong(false);
    const key = await keyFromPassword(password);
    const cfg = await decryptConfig(key, blob);
    setBusy(false);
    if (!cfg) {
      setWrong(true);
      return;
    }
    onUnlock(cfg, key, remember);
  }

  return (
    <div className="lock">
      <form className="lock-card" onSubmit={submit}>
        <img src="/favicon.svg" alt="" width={64} height={64} />
        <h1>Birthday Book</h1>
        <p className="lock-hint">Enter the password to open your list.</p>
        {/* A hidden username lets Chrome's password manager save this login. */}
        <input type="text" name="username" autoComplete="username" value="birthday-book" readOnly hidden />
        <input
          className="search"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Password"
          aria-label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {wrong && <p className="lock-error">Wrong password. Try again.</p>}
        <label className="lock-remember">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Remember on this device
        </label>
        <button type="submit" className="btn btn-block" disabled={busy || !password}>
          {busy ? "Checking" : "Unlock"}
        </button>
      </form>
    </div>
  );
}
