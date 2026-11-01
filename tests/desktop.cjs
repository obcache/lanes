const { _electron } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
(async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "lanes-desktop-"));
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  let app;
  const errors = [];
  try {
    app = await _electron.launch({
      executablePath: path.resolve(
        process.env.LANES_TEST_EXECUTABLE || "dist/LANES-win32-x64/LANES.exe",
      ),
      args: [`--user-data-dir=${temp}`],
      env,
      timeout: 30000,
    });
    const p = await app.firstWindow();
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await p.getByRole("heading", { name: "Your library" }).waitFor();
    assert.equal(await p.evaluate(() => typeof window.require), "undefined");
    assert.equal(await p.evaluate(() => Boolean(window.lanes)), true);
    const button = (name) => p.getByRole("button", { name, exact: true });
    await button("Settings").click();
    await p.getByRole("spinbutton", { name: "Timing offset (ms)" }).fill("42");
    await p.waitForFunction(async () => {
      const data = await window.lanes.read("settings");
      return data.offsetMs === 42;
    });
    const saved = JSON.parse(
      await fs.readFile(path.join(temp, "settings.json"), "utf8"),
    );
    assert.equal(saved.offsetMs, 42);
    await assert.rejects(() =>
      p.evaluate(() => window.lanes.read("../escape")),
    );
    await p.screenshot({
      path: path.join(os.tmpdir(), "lanes-desktop.png"),
      fullPage: true,
    });
    await button("Library").click();
    await button("Beginner").click();
    await button("Play track").click();
    await p.locator(".game-stats").waitFor();
    await p.waitForTimeout(300);
    await button("Pause").click();
    await button("Resume").waitFor();
    await p.screenshot({
      path: path.join(os.tmpdir(), "lanes-desktop-game.png"),
    });
    await app.close();
    app = null;
    const restarted = await _electron.launch({
      executablePath: path.resolve(
        process.env.LANES_TEST_EXECUTABLE || "dist/LANES-win32-x64/LANES.exe",
      ),
      args: [`--user-data-dir=${temp}`],
      env,
      timeout: 30000,
    });
    app = restarted;
    const next = await app.firstWindow();
    await next.getByRole("heading", { name: "Your library" }).waitFor();
    assert.equal(
      await next.evaluate(
        async () => (await window.lanes.read("settings")).offsetMs,
      ),
      42,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS packaged Windows startup, isolated preload, validated IPC, JSON persistence across restart, practice playback/pause, CSP and console.",
    );
  } finally {
    if (app) await app.close();
    await fs.rm(temp, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
