import { describe, expect, it } from "vitest";
import { decryptConfig, encryptConfig, keyFromPassword } from "./lock";
import { sheetRowLink } from "../config";

describe("lock", () => {
  const cfg = { csvUrl: "https://example.com/pub?gid=7&output=csv", editUrl: "https://example.com/edit" };

  it("round trips with the right password and rejects a wrong one", async () => {
    const blob = await encryptConfig("correct horse", cfg);
    expect(blob.data).not.toContain("example");
    expect(await decryptConfig(await keyFromPassword("correct horse"), blob)).toEqual(cfg);
    expect(await decryptConfig(await keyFromPassword("wrong"), blob)).toBeNull();
  });

  it("keeps a remembered key valid across rebuilds with the same password", async () => {
    const key = await keyFromPassword("correct horse");
    const rebuilt = await encryptConfig("correct horse", cfg);
    expect(await decryptConfig(key, rebuilt)).toEqual(cfg);
  });
});

describe("sheetRowLink", () => {
  it("points at the row on the published tab", () => {
    expect(
      sheetRowLink("https://docs.google.com/spreadsheets/d/X/edit?usp=sharing", "https://x/pub?gid=7&output=csv", 5),
    ).toBe("https://docs.google.com/spreadsheets/d/X/edit#gid=7&range=A5");
    expect(sheetRowLink("", "https://x/pub", 5)).toBeNull();
  });
});
