const { chromium, _electron } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
(async () => {
  const browser = await chromium.launch(),
    errors = [];
  let app, temp;
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 950 },
    });
    await context.addInitScript(() => {
      let requests = 0;
      Object.defineProperty(navigator, "requestMIDIAccess", {
        configurable: true,
        value: async () => {
          requests++;
          if (requests === 1)
            throw new DOMException(
              "Permission to use Web MIDI API was not granted.",
              "NotAllowedError",
            );
          return {
            inputs: new Map(),
            outputs: new Map(),
            sysexEnabled: false,
            onstatechange: null,
          };
        },
      });
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (text) => {
            window.__copiedMidiSettings = text;
          },
        },
      });
    });
    const p = await context.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await p.goto(process.env.LANES_TEST_URL || "http://127.0.0.1:5173");
    await p.getByRole("heading", { name: "Your library" }).waitFor();
    await p.getByRole("button", { name: "Settings", exact: true }).click();
    await p.getByRole("button", { name: "Connect MIDI", exact: true }).click();
    const alert = p.getByRole("alert");
    await alert
      .getByRole("heading", { name: "MIDI device access is blocked" })
      .waitFor();
    await alert
      .getByRole("button", { name: "Open device access settings", exact: true })
      .click();
    await p
      .getByRole("heading", { name: "MIDI device access", exact: true })
      .waitFor();
    assert.equal(
      await p
        .getByRole("textbox", { name: "MIDI settings address" })
        .inputValue(),
      "chrome://settings/content/midiDevices",
    );
    await p
      .getByRole("button", { name: "Copy settings address", exact: true })
      .click();
    assert.equal(
      await p.evaluate(() => window.__copiedMidiSettings),
      "chrome://settings/content/midiDevices",
    );
    await p.screenshot({
      path: path.join(os.tmpdir(), "lanes-midi-permission-browser.png"),
      fullPage: true,
    });
    await p.setViewportSize({ width: 390, height: 844 });
    await alert.scrollIntoViewIfNeeded();
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await p.screenshot({
      path: path.join(os.tmpdir(), "lanes-midi-permission-mobile.png"),
    });
    await alert
      .getByRole("button", { name: "Try MIDI again", exact: true })
      .click();
    await p.waitForFunction(
      () => !document.querySelector(".midi-access-notice"),
    );
    await p.waitForFunction(
      () =>
        JSON.parse(localStorage.getItem("lanes.settings")).midiEnabled === true,
    );
    console.log(
      "PASS browser: permission denial -> persistent alert -> settings instructions/address copy -> retry clears alert, enables MIDI; mobile fits.",
    );
    await browser.close();
    temp = await fs.mkdtemp(path.join(os.tmpdir(), "lanes-midi-recovery-"));
    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE;
    app = await _electron.launch({
      executablePath: path.resolve("dist/LANES-win32-x64/LANES.exe"),
      args: ["--user-data-dir=" + temp],
      env,
    });
    const page = await app.firstWindow();
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.getByRole("heading", { name: "Your library" }).waitFor();
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.evaluate(async () => {
      const settings = await window.lanes.read("settings");
      await window.lanes.write("settings", {
        ...settings,
        midiAccessAllowed: false,
      });
    });
    await page.reload();
    await page.getByRole("heading", { name: "Make it feel right." }).waitFor();
    const denied = await page.evaluate(async () => {
      try {
        await navigator.requestMIDIAccess({ sysex: false });
        return "allowed";
      } catch (error) {
        return error.name;
      }
    });
    assert.equal(denied, "NotAllowedError");
    await page
      .getByRole("button", { name: "Connect MIDI", exact: true })
      .click();
    const desktopAlert = page.getByRole("alert");
    await desktopAlert
      .getByRole("heading", { name: "MIDI device access is blocked" })
      .waitFor();
    await page.locator(".workspace").evaluate((element) => {
      element.scrollTop = 0;
    });
    await page.screenshot({
      path: path.join(os.tmpdir(), "lanes-midi-alert-desktop.png"),
    });
    await desktopAlert
      .getByRole("button", { name: "Open device access settings", exact: true })
      .click();
    const toggle = page.getByRole("checkbox", {
      name: "Allow LANES to access MIDI devices",
    });
    assert.equal(await toggle.isChecked(), false);
    await page.screenshot({
      path: path.join(os.tmpdir(), "lanes-midi-permission-desktop.png"),
      fullPage: true,
    });
    await toggle.check();
    await page.waitForFunction(
      async () =>
        (await window.lanes.read("settings")).midiAccessAllowed === true,
    );
    await page
      .locator(".midi-device-access")
      .getByRole("button", { name: "Try MIDI again", exact: true })
      .click();
    await page.waitForFunction(
      () => !document.querySelector(".midi-access-notice"),
    );
    const midi = await page.evaluate(async () => {
      const midi = await navigator.requestMIDIAccess({ sysex: false });
      return { sysex: midi.sysexEnabled, inputs: midi.inputs.size };
    });
    assert.equal(midi.sysex, false);
    assert.equal(
      JSON.parse(await fs.readFile(path.join(temp, "settings.json"), "utf8"))
        .midiAccessAllowed,
      true,
    );
    await page.screenshot({
      path: path.join(os.tmpdir(), "lanes-midi-recovered-desktop.png"),
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    console.log(
      "PASS desktop: saved denial -> alert -> device access checkbox -> persisted allow -> real Chromium MIDI request succeeds, sysexEnabled=false; console clean.",
    );
  } finally {
    await browser.close();
    if (app) await app.close();
    if (temp) {
      assert.equal(path.dirname(temp), os.tmpdir());
      await fs.rm(temp, { recursive: true, force: true });
    }
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
