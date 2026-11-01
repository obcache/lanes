import { describe, it, expect } from "vitest";
import { analyze, makeCharts } from "../src/core/analysis";
import {
  calibrationOffset,
  findHit,
  midiLane,
  summarize,
} from "../src/core/judgement";
import {
  difficulties,
  laneCounts,
  ChartSchema,
  SettingsSchema,
  defaults,
} from "../src/shared/model";
describe("musical analysis", () => {
  it("detects 120 BPM transients without inventing silent notes", () => {
    const sr = 22050,
      audio = new Float32Array(sr * 12);
    for (let time = 0.5; time < 11.5; time += 0.5) {
      for (let j = 0; j < 800; j++)
        audio[Math.round(time * sr) + j] =
          Math.sin((2 * Math.PI * 220 * j) / sr) * Math.exp(-j / 120);
    }
    const result = analyze(audio, sr);
    expect(result.onsets.length).toBeGreaterThanOrEqual(20);
    expect(result.bpm).toBeGreaterThanOrEqual(118);
    expect(result.bpm).toBeLessThanOrEqual(122);
    expect(
      result.onsets.every(
        (n) => Math.abs(n.time / 0.5 - Math.round(n.time / 0.5)) < 0.1,
      ),
    ).toBe(true);
    expect(analyze(new Float32Array(sr * 3), sr).onsets).toHaveLength(0);
  });
  it("produces 4 deterministic maps with 3/4/5/5 lanes and increasing density", () => {
    const onsets = Array.from({ length: 100 }, (_, i) => ({
      time: 1 + i * 0.12,
      strength: 1 + (i % 3),
      band: i % 5,
    }));
    const a = makeCharts(onsets),
      b = makeCharts(onsets);
    expect(a).toEqual(b);
    let count = 0;
    for (const d of difficulties) {
      expect(ChartSchema.safeParse(a[d]).success).toBe(true);
      expect(a[d].notes.length).toBeGreaterThanOrEqual(count);
      count = a[d].notes.length;
      expect(a[d].notes.every((n) => n.lane < laneCounts[d])).toBe(true);
      expect(new Set(a[d].notes.map((n) => n.lane)).size).toBe(laneCounts[d]);
    }
  });
});
describe("timing and input", () => {
  it("hits the nearest unjudged note once and handles chord lanes separately", () => {
    const notes = [
      { time: 1, lane: 0 },
      { time: 1, lane: 1 },
      { time: 1.2, lane: 0 },
    ];
    const judged = new Map<number, "perfect" | "good" | "miss">();
    expect(findHit(notes, judged, 0, 1.03)).toEqual({
      index: 0,
      judgement: "perfect",
    });
    judged.set(0, "perfect");
    expect(findHit(notes, judged, 0, 1.03)).toBeNull();
    expect(findHit(notes, judged, 1, 1.08)?.judgement).toBe("good");
    expect(findHit(notes, judged, 0, 0.8)).toBeNull();
  });
  it("derives score from hit counts including misses", () => {
    expect(
      summarize(
        new Map([
          [0, "perfect"],
          [1, "good"],
        ]),
        4,
        2,
      ),
    ).toEqual({
      perfect: 1,
      good: 1,
      miss: 2,
      total: 4,
      maxCombo: 2,
      score: 1500,
      accuracy: 37.5,
    });
  });
  it("rejects calibration outliers and requires samples", () => {
    expect(calibrationOffset([20, 25, 24])).toBeNull();
    expect(calibrationOffset([20, 24, 25, 22, 23, 200])).toBe(23);
    expect(calibrationOffset([-25, -22, -21, -24])).toBe(-23);
  });
  it("accepts all MIDI channels by default, filters channels, ignores note off and zero velocity", () => {
    const notes = [60, 62, 64, 65, 67];
    expect(defaults.midiChannel).toBe("all");
    expect(midiLane(new Uint8Array([0x95, 64, 100]), notes, "all")).toBe(2);
    expect(midiLane(new Uint8Array([0x95, 64, 100]), notes, 6)).toBe(2);
    expect(midiLane(new Uint8Array([0x95, 64, 100]), notes, 1)).toBe(-1);
    expect(midiLane(new Uint8Array([0x90, 60, 0]), notes, "all")).toBe(-1);
    expect(midiLane(new Uint8Array([0x80, 60, 100]), notes, "all")).toBe(-1);
  });
  it("rejects unsafe server protocols and duplicate key mappings", () => {
    expect(
      SettingsSchema.safeParse({
        ...defaults,
        apiUrl: "http://example.com/api",
      }).success,
    ).toBe(false);
    expect(
      SettingsSchema.safeParse({ ...defaults, apiUrl: "file:///etc/passwd" })
        .success,
    ).toBe(false);
    expect(
      SettingsSchema.safeParse({
        ...defaults,
        keybinds: ["KeyD", "KeyD", "KeyJ", "KeyK", "KeyL"],
      }).success,
    ).toBe(false);
  });
});
