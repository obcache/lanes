import { describe, it, expect } from "vitest";
import { allowMidiPermission } from "../electron/midi-permission";
import { isMidiPermissionError } from "../src/core/midi";
import { SettingsSchema, defaults } from "../src/shared/model";
describe("MIDI permission recovery", () => {
  it("allows Chromium's two MIDI names only for the permitted local main frame", () => {
    for (const permission of ["midi", "midiSysex"]) {
      expect(
        allowMidiPermission(
          permission,
          true,
          true,
          "lanes://app/index.html",
          true,
        ),
      ).toBe(true);
      expect(
        allowMidiPermission(
          permission,
          false,
          true,
          "lanes://app/index.html",
          true,
        ),
      ).toBe(false);
      expect(
        allowMidiPermission(
          permission,
          true,
          false,
          "lanes://app/index.html",
          true,
        ),
      ).toBe(false);
      expect(
        allowMidiPermission(
          permission,
          true,
          true,
          "lanes://app/index.html",
          false,
        ),
      ).toBe(false);
      for (const url of [
        "https://app/",
        "lanes://app.evil/",
        "lanes://app@evil/",
        "invalid",
      ])
        expect(allowMidiPermission(permission, true, true, url, true)).toBe(
          false,
        );
    }
    for (const permission of [
      "media",
      "usb",
      "serial",
      "clipboard-read",
      "unknown",
    ])
      expect(
        allowMidiPermission(
          permission,
          true,
          true,
          "lanes://app/index.html",
          true,
        ),
      ).toBe(false);
  });
  it("recognizes permission errors without mislabeling hardware or unsupported errors", () => {
    expect(
      isMidiPermissionError(new DOMException("blocked", "NotAllowedError")),
    ).toBe(true);
    expect(isMidiPermissionError({ name: "SecurityError" })).toBe(true);
    expect(isMidiPermissionError(new Error("device disconnected"))).toBe(false);
    expect(isMidiPermissionError(null)).toBe(false);
  });
  it("preserves the existing app policy for old settings and saves explicit access denial", () => {
    const { midiAccessAllowed: _, ...oldSettings } = defaults;
    expect(SettingsSchema.parse(oldSettings).midiAccessAllowed).toBe(true);
    expect(
      SettingsSchema.parse({ ...defaults, midiAccessAllowed: false })
        .midiAccessAllowed,
    ).toBe(false);
  });
});
