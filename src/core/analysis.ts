import FFT from "fft.js";
import {
  difficulties,
  laneCounts,
  type Chart,
  type Difficulty,
} from "../shared/model";
export type Onset = { time: number; strength: number; band: number };
/** Positive spectral flux, locally adaptive peak picking, and weighted tempo voting. */
export function analyze(samples: Float32Array, sampleRate: number) {
  const size = 1024,
    hop = 256,
    fft = new FFT(size),
    spectrum = fft.createComplexArray(),
    frame = new Float32Array(size),
    previous = new Float32Array(size / 2);
  const flux: number[] = [],
    bands: number[] = [];
  for (let start = 0; start + size < samples.length; start += hop) {
    for (let j = 0; j < size; j++)
      frame[j] =
        samples[start + j] *
        (0.5 - 0.5 * Math.cos((2 * Math.PI * j) / (size - 1)));
    fft.realTransform(spectrum, frame);
    let novelty = 0;
    const energy = [0, 0, 0, 0, 0];
    for (let k = 1; k < size / 2; k++) {
      const magnitude = Math.log1p(
        Math.hypot(spectrum[2 * k], spectrum[2 * k + 1]),
      );
      const change = Math.max(0, magnitude - previous[k]);
      previous[k] = magnitude;
      novelty += change;
      const hz = (k * sampleRate) / size;
      energy[hz < 180 ? 0 : hz < 500 ? 1 : hz < 1500 ? 2 : hz < 4000 ? 3 : 4] +=
        change;
    }
    flux.push(novelty);
    bands.push(energy.indexOf(Math.max(...energy)));
  }
  const onsets: Onset[] = [];
  for (let i = 2; i < flux.length - 2; i++) {
    const neighborhood = flux.slice(
      Math.max(0, i - 24),
      Math.min(flux.length, i + 25),
    );
    const mean = neighborhood.reduce((a, b) => a + b, 0) / neighborhood.length;
    if (
      flux[i] > Math.max(0.08, mean * 1.35) &&
      flux[i] >= flux[i - 1] &&
      flux[i] > flux[i + 1]
    ) {
      // Correct the analysis-window centre; keep imported onsets on their actual transients.
      const time = (i * hop + size / 2) / sampleRate;
      if (!onsets.length || time - onsets[onsets.length - 1].time >= 0.075)
        onsets.push({ time, strength: flux[i], band: bands[i] });
    }
  }
  const votes = new Map<number, number>();
  for (let i = 0; i < onsets.length; i++)
    for (let j = i + 1; j < Math.min(i + 10, onsets.length); j++) {
      const interval = onsets[j].time - onsets[i].time;
      if (interval < 0.2 || interval > 3) continue;
      let bpm = 60 / interval;
      while (bpm < 80) bpm *= 2;
      while (bpm > 180) bpm /= 2;
      const bucket = Math.round(bpm);
      votes.set(bucket, (votes.get(bucket) || 0) + 1 / (j - i));
    }
  const bpm = [...votes].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
  return { onsets, bpm, charts: makeCharts(onsets) };
}
export function makeCharts(onsets: Onset[]): Record<Difficulty, Chart> {
  const gaps = { beginner: 0.48, normal: 0.28, expert: 0.15, pro: 0.09 };
  const strengths = onsets.map((n) => n.strength).sort((a, b) => a - b);
  const thresholds = {
    beginner: strengths[Math.floor(strengths.length * 0.4)] || 0,
    normal: strengths[Math.floor(strengths.length * 0.15)] || 0,
    expert: 0,
    pro: 0,
  };
  return Object.fromEntries(
    difficulties.map((difficulty) => {
      const notes: Chart["notes"] = [];
      let last = -10,
        previousLane = -1;
      for (const [i, onset] of onsets.entries()) {
        if (
          onset.time - last < gaps[difficulty] ||
          onset.strength < thresholds[difficulty]
        )
          continue;
        let lane = (onset.band + i) % laneCounts[difficulty];
        if (lane === previousLane) lane = (lane + 1) % laneCounts[difficulty];
        notes.push({ time: Math.round(onset.time * 10000) / 10000, lane });
        last = onset.time;
        previousLane = lane;
        if (difficulty === "pro" && i % 7 === 0)
          notes.push({
            time: notes[notes.length - 1].time,
            lane: (lane + 2) % 5,
          });
      }
      return [difficulty, { version: 1, difficulty, notes }];
    }),
  ) as Record<Difficulty, Chart>;
}
