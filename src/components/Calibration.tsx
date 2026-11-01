import { useEffect, useRef, useState } from "react";
import { Play, Square, Check, Volume2 } from "lucide-react";
import type { Settings } from "../shared/model";
import { calibrationOffset, midiLane } from "../core/judgement";
import { onMidi } from "../core/midi";
export default function Calibration({
  settings,
  onApply,
}: {
  settings: Settings;
  onApply: (offset: number) => void;
}) {
  const [running, setRunning] = useState(false),
    [taps, setTaps] = useState<number[]>([]),
    [phase, setPhase] = useState(0),
    [elapsed, setElapsed] = useState(0);
  const tapRef = useRef<() => void>(() => {});
  const offset = calibrationOffset(taps);
  useEffect(() => {
    if (!running) return;
    const ctx = new AudioContext({ latencyHint: "interactive" });
    let raf = 0,
      canceled = false;
    const samples: number[] = [],
      used = new Set<number>();
    let start = 0;
    const removeMidi = onMidi((data, device) => {
      if (
        (settings.midiDevice === "all" || device === settings.midiDevice) &&
        midiLane(data, settings.midiNotes, settings.midiChannel) >= 0
      )
        tapRef.current();
    });
    const key = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (settings.keybinds.includes(e.code) || e.code === "Space") {
        e.preventDefault();
        tapRef.current();
      }
    };
    void ctx.resume().then(() => {
      if (canceled) return;
      start = ctx.currentTime + 2;
      for (let i = 0; i < 32; i++) {
        const osc = ctx.createOscillator(),
          gain = ctx.createGain(),
          when = start + i * 0.5;
        osc.frequency.value = i % 4 === 0 ? 1200 : 800;
        gain.gain.setValueAtTime(0, when);
        gain.gain.linearRampToValueAtTime(settings.volume * 0.4, when + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.001, when + 0.065);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(when);
        osc.stop(when + 0.08);
      }
      tapRef.current = () => {
        const t = ctx.currentTime - start,
          beat = Math.round(t / 0.5);
        if (beat < 0 || beat >= 32 || used.has(beat)) return;
        const error = (t - beat * 0.5) * 1000;
        if (Math.abs(error) > 240) return;
        used.add(beat);
        samples.push(error);
        setTaps([...samples]);
      };
      function tick() {
        if (canceled) return;
        const time = ctx.currentTime - start;
        setPhase((((time % 0.5) + 0.5) % 0.5) / 0.5);
        setElapsed(time);
        if (time > 16) {
          setRunning(false);
          const finalOffset = calibrationOffset(samples);
          if (samples.length >= 8 && finalOffset !== null) onApply(finalOffset);
          return;
        }
        raf = requestAnimationFrame(tick);
      }
      tick();
      window.addEventListener("keydown", key);
    });
    return () => {
      canceled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", key);
      removeMidi();
      tapRef.current = () => {};
      void ctx.close();
    };
  }, [
    running,
    settings.keybinds,
    settings.midiNotes,
    settings.midiChannel,
    settings.midiDevice,
    settings.volume,
  ]);
  return (
    <section className="settings-section calibration">
      <div className="section-heading">
        <div>
          <h2>Find your timing.</h2>
          <p>
            Follow the metronome. Tap any lane key or MIDI note as the note
            meets the line.
          </p>
        </div>
        <Volume2 size={24} />
      </div>
      <div className="calibration-layout">
        <button
          className={`calibration-lane ${running ? "running" : ""}`}
          aria-label="Tap calibration beat"
          onPointerDown={() => tapRef.current()}
        >
          <div
            className="calibration-note"
            style={{ top: `${running ? Math.min(88, phase * 100) : 25}%` }}
          />
          <div className="hit-line" />
          <span>
            {running ? (elapsed < 0 ? "Get ready…" : "TAP") : "120 BPM"}
          </span>
        </button>
        <div className="calibration-readout">
          <strong>
            {offset !== null ? `${offset > 0 ? "+" : ""}${offset} ms` : "— ms"}
          </strong>
          <p>
            {taps.length} timing samples · {running ? "listening" : "ready"}
          </p>
          <p className="muted">
            The estimate adapts as you tap and saves at the end of the session.
            Apply early after at least 8 taps. Positive offsets compensate for
            late input.
          </p>
          <div className="button-row">
            <button
              className="secondary"
              onClick={() => {
                if (!running) setTaps([]);
                setRunning(!running);
              }}
            >
              {running ? <Square size={15} /> : <Play size={15} />}{" "}
              {running ? "Stop" : "Start calibration"}
            </button>
            <button
              className="primary"
              disabled={taps.length < 8 || offset === null}
              onClick={() => {
                setRunning(false);
                onApply(offset!);
              }}
            >
              <Check size={16} /> Apply offset
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
