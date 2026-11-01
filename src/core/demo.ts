import { makeCharts } from "./analysis";
import type { Track } from "../shared/model";
export const demoTracks: Track[] = [
  ["glass", "Glass Current", 120, 60],
  ["after", "After Hours", 140, 92],
  ["ultraviolet", "Ultraviolet", 160, 108],
].map(([id, title, bpm, duration], art) => ({
  id: `demo-${id}`,
  title: String(title),
  artist: "LANES Studio",
  bpm: Number(bpm),
  duration: Number(duration),
  art,
  favorite: art === 0,
  importedAt: "2026-10-31T00:00:00.000Z",
  charts: makeCharts(
    Array.from(
      { length: Math.floor(((Number(duration) - 4) * Number(bpm)) / 60) },
      (_, i) => ({
        time: 2 + (i * 60) / Number(bpm),
        strength: 1 + (i % 4 === 0 ? 1 : 0),
        band: i % 5,
      }),
    ),
  ),
}));
/** Original synthesized practice tracks, generated locally with the exact chart clock. */
export function synthesize(track: Track, ctx: BaseAudioContext) {
  const sr = 22050,
    buffer = ctx.createBuffer(1, Math.ceil(track.duration * sr), sr),
    out = buffer.getChannelData(0),
    beat = 60 / track.bpm;
  for (let i = 0; i < out.length; i++) {
    const t = i / sr,
      position = (t - 2) / beat,
      phase = (((position % 1) + 1) % 1) * beat;
    if (t < 2) continue;
    const step = Math.floor(position),
      freq = [130.81, 164.81, 196, 146.83][Math.floor(step / 8) % 4];
    const kick =
      Math.sin(2 * Math.PI * (48 * phase + 6 * (1 - Math.exp(-phase * 30)))) *
      Math.exp(-phase * 18) *
      0.35;
    const tone = Math.sin(2 * Math.PI * freq * t) * Math.exp(-phase * 6) * 0.15;
    const hat =
      Math.sin(t * 18000) * Math.sin(t * 23971) * Math.exp(-phase * 80) * 0.08;
    out[i] = (kick + tone + hat) * Math.min(1, (track.duration - t) / 2);
  }
  return buffer;
}
