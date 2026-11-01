import type { Note } from "../shared/model";
export const WINDOWS = { perfect: 0.045, good: 0.11 };
export type Judgement = "perfect" | "good" | "miss";
export function findHit(
  notes: Note[],
  judged: Map<number, Judgement>,
  lane: number,
  time: number,
) {
  let best = -1,
    delta = WINDOWS.good + Number.EPSILON;
  for (let i = 0; i < notes.length; i++) {
    if (notes[i].time > time + WINDOWS.good) break;
    if (notes[i].lane !== lane || judged.has(i)) continue;
    const distance = Math.abs(notes[i].time - time);
    if (distance < delta) {
      delta = distance;
      best = i;
    }
  }
  return best < 0
    ? null
    : {
        index: best,
        judgement: (delta <= WINDOWS.perfect ? "perfect" : "good") as Judgement,
      };
}
export function summarize(
  judged: Map<number, Judgement>,
  total: number,
  maxCombo: number,
) {
  let perfect = 0,
    good = 0;
  for (const v of judged.values()) {
    if (v === "perfect") perfect++;
    if (v === "good") good++;
  }
  const miss = total - perfect - good;
  return {
    perfect,
    good,
    miss,
    total,
    maxCombo,
    score: perfect * 1000 + good * 500,
    accuracy: total
      ? Math.round(((perfect + good * 0.5) / total) * 10000) / 100
      : 0,
  };
}
export function calibrationOffset(samples: number[]) {
  if (samples.length < 4) return null;
  const sorted = [...samples].sort((a, b) => a - b),
    median = sorted[Math.floor(sorted.length / 2)];
  const clean = sorted.filter((n) => Math.abs(n - median) < 75);
  return Math.round(
    Math.max(
      -250,
      Math.min(250, clean.reduce((a, b) => a + b, 0) / clean.length),
    ),
  );
}
export function midiLane(
  data: Uint8Array,
  notes: number[],
  channel: "all" | number,
) {
  if (data.length < 3 || (data[0] & 0xf0) !== 0x90 || data[2] === 0) return -1;
  if (channel !== "all" && (data[0] & 0x0f) + 1 !== channel) return -1;
  return notes.indexOf(data[1]);
}
