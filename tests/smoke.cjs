const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs/promises");
function wav() {
  const sr = 22050,
    n = sr * 8,
    b = Buffer.alloc(44 + n * 2);
  b.write("RIFF");
  b.writeUInt32LE(36 + n * 2, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sr, 24);
  b.writeUInt32LE(sr * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const p = (i / sr) % 0.5;
    b.writeInt16LE(
      Math.round(
        Math.sin((2 * Math.PI * 220 * i) / sr) * Math.exp(-p * 40) * 25000,
      ),
      44 + i * 2,
    );
  }
  return b;
}
(async () => {
  const browser = await chromium.launch();
  const errors = [],
    screenshots = [];
  try {
    const p = await browser.newPage({ viewport: { width: 1586, height: 992 } });
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    const button = (name) => p.getByRole("button", { name, exact: true });
    const capture = async (name) => {
      const file = path.join(os.tmpdir(), `lanes-${name}.png`);
      await p.screenshot({ path: file, fullPage: true });
      screenshots.push(file);
    };
    await p.goto(process.env.LANES_TEST_URL || "http://127.0.0.1:5173");
    await p.getByRole("heading", { name: "Your library" }).waitFor();
    assert.equal(await p.locator(".track-row").count(), 3);
    await capture("library");
    await p.getByRole("textbox", { name: "Search tracks" }).fill("ultraviolet");
    assert.equal(await p.locator(".track-row").count(), 1);
    await p.getByRole("textbox", { name: "Search tracks" }).fill("");
    await button("Unfavorite Glass Current").click();
    await button("Favorites").click();
    assert.equal(await p.locator(".track-row").count(), 0);
    await p.getByRole("button", { name: /All tracks/ }).click();
    await button("Favorite Glass Current").click();
    await p.locator('input[aria-label="Import music files"]').setInputFiles({
      name: "Fixture Pulse.wav",
      mimeType: "audio/wav",
      buffer: wav(),
    });
    await button("Select Fixture Pulse").waitFor({ timeout: 30000 });
    await button("Select Fixture Pulse").click();
    const library = await p.evaluate(() =>
      JSON.parse(localStorage.getItem("lanes.library")),
    );
    const imported = library.tracks.find((t) => t.title === "Fixture Pulse");
    assert.equal(Object.keys(imported.charts).length, 4);
    for (const [d, count] of [
      ["beginner", 3],
      ["normal", 4],
      ["expert", 5],
      ["pro", 5],
    ])
      assert.ok(imported.charts[d].notes.every((n) => n.lane < count));
    await button("Playlists").click();
    await button("New playlist").click();
    await p
      .getByRole("textbox", { name: "Playlist name" })
      .fill("Smoke session");
    await button("Create playlist").click();
    await p
      .getByRole("combobox", { name: "Add track to playlist" })
      .selectOption(imported.id);
    await p
      .getByRole("combobox", { name: "Add track to playlist" })
      .selectOption("demo-glass");
    await button("Move Glass Current up").click();
    const playlists = await p.evaluate(() =>
      JSON.parse(localStorage.getItem("lanes.playlists")),
    );
    assert.deepEqual(playlists.playlists[0].trackIds, [
      "demo-glass",
      imported.id,
    ]);
    await button("Settings").click();
    await p.locator(".mapping-row").first().getByRole("button").first().click();
    await p.keyboard.press("a");
    assert.equal(
      await p.locator(".mapping-row").first().locator("kbd").innerText(),
      "A",
    );
    await p
      .getByRole("combobox", { name: "MIDI channel", exact: true })
      .selectOption("7");
    await p.getByRole("spinbutton", { name: "Timing offset (ms)" }).fill("25");
    await p.reload();
    await p.locator(".settings-page").waitFor();
    assert.equal(
      await p
        .getByRole("combobox", { name: "MIDI channel", exact: true })
        .inputValue(),
      "7",
    );
    assert.equal(
      await p
        .getByRole("spinbutton", { name: "Timing offset (ms)" })
        .inputValue(),
      "25",
    );
    await capture("settings");
    await button("Start calibration").click();
    await p.waitForTimeout(2000);
    for (let i = 0; i < 9; i++) {
      await p.keyboard.press("a");
      await p.waitForTimeout(500);
    }
    assert.equal(await button("Apply offset").isEnabled(), true);
    await button("Apply offset").click();
    await button("Profile").click();
    await p
      .getByRole("textbox", { name: "Display name", exact: true })
      .fill("Smoke Player");
    await button("Save name").click();
    await p
      .locator('input[aria-label="Upload background"]')
      .setInputFiles(path.resolve("public/art/aurora.webp"));
    await p
      .locator('input[aria-label="Upload lane texture"]')
      .setInputFiles(path.resolve("public/art/aurora.webp"));
    await p.waitForFunction(
      () =>
        JSON.parse(localStorage.getItem("lanes.profile")).laneSkin.length > 100,
    );
    await p.reload();
    await p
      .getByRole("heading", { name: "Smoke Player", exact: true })
      .waitFor();
    assert.ok(
      (
        await p.evaluate(
          () => JSON.parse(localStorage.getItem("lanes.profile")).background,
        )
      ).startsWith("data:image/webp"),
    );
    await capture("profile");
    await button("Settings").click();
    const [download] = await Promise.all([
      p.waitForEvent("download"),
      button("Export JSON").click(),
    ]);
    const backup = JSON.parse(await fs.readFile(await download.path(), "utf8"));
    assert.equal(backup.schemaVersion, 1);
    assert.equal(backup.library.tracks.length, 4);
    const [chooser] = await Promise.all([
      p.waitForEvent("filechooser"),
      button("Import JSON").click(),
    ]);
    await chooser.setFiles({
      name: "lanes-backup-v1.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(backup)),
    });
    await p
      .getByRole("status")
      .filter({ hasText: "Local JSON backup imported." })
      .waitFor();
    assert.ok(
      await p.evaluate(
        () =>
          JSON.parse(localStorage.getItem("lanes.profile")).background.length >
          100,
      ),
    );
    await button("Library").click();
    await button("Select Fixture Pulse").click();
    await button("Beginner").click();
    await button("Play track").click();
    await p.waitForFunction(
      () =>
        window.render_game_to_text &&
        JSON.parse(window.render_game_to_text()).time > 0.1,
    );
    let game = await p.evaluate(() => JSON.parse(window.render_game_to_text()));
    assert.equal(game.activeLanes, 3);
    await p.keyboard.press("Escape");
    game = await p.evaluate(() => JSON.parse(window.render_game_to_text()));
    assert.equal(game.mode, "paused");
    await p.waitForTimeout(120);
    const paused = await p.evaluate(
      () => JSON.parse(window.render_game_to_text()).time,
    );
    assert.ok(Math.abs(paused - game.time) < 0.01);
    await button("Resume").click();
    await button("Pause").waitFor();
    await p.waitForTimeout(100);
    await capture("game");
    // Drive real keyboard events from the visible chart clock, including calibration.
    await p.evaluate(
      () =>
        new Promise((resolve) => {
          const hit = new Set(),
            settings = JSON.parse(localStorage.getItem("lanes.settings"));
          function frame() {
            if (!window.render_game_to_text) {
              resolve();
              return;
            }
            const state = JSON.parse(window.render_game_to_text());
            if (state.mode === "result") {
              resolve();
              return;
            }
            for (const note of state.notes) {
              const key = `${note.time}:${note.lane}`;
              if (
                !hit.has(key) &&
                state.time >= note.time + settings.offsetMs / 1000
              ) {
                hit.add(key);
                window.dispatchEvent(
                  new KeyboardEvent("keydown", {
                    code: settings.keybinds[note.lane],
                    bubbles: true,
                  }),
                );
              }
            }
            requestAnimationFrame(frame);
          }
          frame();
        }),
    );
    await p
      .getByRole("heading", { name: "Track complete.", exact: true })
      .waitFor({ timeout: 12000 });
    assert.ok(
      (
        await p.evaluate(
          () => JSON.parse(localStorage.getItem("lanes.runs")).runs,
        )
      ).length === 1,
    );
    assert.ok(
      await p.evaluate(
        () => JSON.parse(localStorage.getItem("lanes.runs")).runs[0].score > 0,
      ),
    );
    await button("Play again").click();
    await p.waitForFunction(
      () =>
        window.render_game_to_text &&
        JSON.parse(window.render_game_to_text()).mode === "playing",
    );
    await button("Library").last().click();
    await p.setViewportSize({ width: 390, height: 844 });
    await p.getByRole("heading", { name: "Your library" }).waitFor();
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await capture("mobile");
    await button("Leaderboards").click();
    await p
      .getByRole("heading", { name: "Meet you online.", exact: true })
      .waitFor();
    assert.deepEqual(errors, []);
    console.log(
      "PASS search/favorites; import + four charts; playlist order; keybind/channel/offset persistence; calibration; artwork; play/pause/result/retry; mobile; offline board; console clean.",
    );
    console.log("Evidence:", screenshots.join(", "));
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
