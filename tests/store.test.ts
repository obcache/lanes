import { it, expect } from "vitest";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { JsonStore } from "../electron/store";
import { defaults } from "../src/shared/model";
it("serializes concurrent writes, keeps backup, validates names and preserves corrupt files", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "lanes-store-"));
  try {
    const store = new JsonStore(dir);
    expect(await store.read("settings")).toBeNull();
    await Promise.all([
      store.write("settings", { ...defaults, offsetMs: 20 }),
      store.write("settings", { ...defaults, offsetMs: 30 }),
    ]);
    expect((await store.read("settings"))?.offsetMs).toBe(30);
    expect(
      JSON.parse(await readFile(path.join(dir, "settings.json.bak"), "utf8"))
        .offsetMs,
    ).toBe(20);
    await expect(store.write("../escape" as any, defaults)).rejects.toThrow();
    await expect(
      store.write("settings", { ...defaults, offsetMs: 999 }),
    ).rejects.toThrow();
    await writeFile(path.join(dir, "settings.json"), "{corrupt");
    await expect(store.read("settings")).rejects.toThrow("Original preserved");
    expect(await readFile(path.join(dir, "settings.json"), "utf8")).toBe(
      "{corrupt",
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
