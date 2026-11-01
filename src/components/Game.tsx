import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Pause, Play, RotateCcw, UploadCloud } from "lucide-react";
import {
  laneCounts,
  type Track,
  type Settings,
  type Profile,
  type Run,
} from "../shared/model";
import {
  findHit,
  summarize,
  WINDOWS,
  midiLane,
  type Judgement,
} from "../core/judgement";
import { getAudio, hash } from "../core/storage";
import { synthesize } from "../core/demo";
import { onMidi } from "../core/midi";
import { colors, formatTime, keyLabel } from "./ui";
type Engine = {
  ctx: AudioContext;
  buffer: AudioBuffer;
  source: AudioBufferSourceNode | null;
  gain: GainNode;
  start: number;
  position: number;
  paused: boolean;
  finished: boolean;
  judged: Map<number, Judgement>;
  combo: number;
  maxCombo: number;
  feedback: string;
  flash: number[];
  virtual: number;
};
export default function Game({
  track,
  settings,
  profile,
  onExit,
  onComplete,
  onSync,
}: {
  track: Track;
  settings: Settings;
  profile: Profile;
  onExit: () => void;
  onComplete: (run: Run) => Promise<void>;
  onSync: (run: Run) => Promise<void>;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    engine = useRef<Engine | null>(null),
    [state, setState] = useState({
      loading: true,
      paused: false,
      error: "",
      time: 0,
      score: 0,
      combo: 0,
      accuracy: 100,
    }),
    [result, setResult] = useState<Run | null>(null),
    [sync, setSync] = useState(""),
    [retry, setRetry] = useState(0);
  const chart = track.charts[settings.difficulty],
    count = laneCounts[settings.difficulty];
  useEffect(() => {
    let canceled = false,
      raf = 0,
      lastHud = 0,
      finishing = false;
    setState({
      loading: true,
      paused: false,
      error: "",
      time: 0,
      score: 0,
      combo: 0,
      accuracy: 100,
    });
    setResult(null);
    setSync("");
    const ctx = new AudioContext({ latencyHint: "interactive" });
    const current = (e: Engine) =>
      e.paused ? e.position : ctx.currentTime - e.start + e.virtual;
    function play(e: Engine) {
      const source = ctx.createBufferSource();
      source.buffer = e.buffer;
      source.connect(e.gain);
      e.start = ctx.currentTime - e.position;
      e.virtual = 0;
      source.start(
        ctx.currentTime + Math.max(0, -e.position),
        Math.max(0, Math.min(e.position, e.buffer.duration - 0.001)),
      );
      e.source = source;
      e.paused = false;
    }
    function pause() {
      const e = engine.current;
      if (!e || e.finished) return;
      if (e.paused) {
        void ctx.resume().then(() => {
          if (canceled) return;
          play(e);
          setState((s) => ({ ...s, paused: false }));
        });
      } else {
        e.position = current(e);
        e.source?.stop();
        e.paused = true;
        setState((s) => ({ ...s, paused: true }));
      }
    }
    function hit(lane: number) {
      const e = engine.current;
      if (!e || e.paused || e.finished || lane < 0 || lane >= count) return;
      e.flash[lane] = ctx.currentTime;
      const hit = findHit(
        chart.notes,
        e.judged,
        lane,
        current(e) - settings.offsetMs / 1000,
      );
      if (hit) {
        e.judged.set(hit.index, hit.judgement);
        e.combo++;
        e.maxCombo = Math.max(e.maxCombo, e.combo);
        e.feedback = hit.judgement.toUpperCase();
      } else {
        e.feedback = "EARLY / LATE";
      }
    }
    const key = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.code === "Escape") {
        event.preventDefault();
        pause();
        return;
      }
      const lane = settings.keybinds.indexOf(event.code);
      if (lane >= 0) {
        event.preventDefault();
        hit(lane);
      }
    };
    const removeMidi = onMidi((data, device) => {
      if (settings.midiDevice === "all" || device === settings.midiDevice)
        hit(midiLane(data, settings.midiNotes, settings.midiChannel));
    });
    const touch = (ev: PointerEvent) => {
      const rect = canvas.current!.getBoundingClientRect();
      hit(Math.floor(((ev.clientX - rect.left) / rect.width) * 5));
    };
    async function finish(e: Engine) {
      if (finishing) return;
      finishing = true;
      e.finished = true;
      e.source?.stop();
      const totals = summarize(e.judged, chart.notes.length, e.maxCombo);
      const run: Run = {
        ...totals,
        id: crypto.randomUUID(),
        trackId: track.id,
        difficulty: settings.difficulty,
        chartHash: await hash(JSON.stringify(chart)),
        completedAt: new Date().toISOString(),
      };
      setResult(run);
      try {
        await onComplete(run);
      } catch (error) {
        setSync(`Could not save result: ${String(error)}`);
      }
    }
    const background = new Image(),
      laneImage = new Image();
    if (profile.background) background.src = profile.background;
    if (profile.laneSkin) laneImage.src = profile.laneSkin;
    function draw() {
      if (canceled) return;
      const e = engine.current,
        c = canvas.current;
      if (!e || !c) return;
      const rect = c.getBoundingClientRect(),
        dpr = devicePixelRatio || 1;
      if (
        c.width !== Math.floor(rect.width * dpr) ||
        c.height !== Math.floor(rect.height * dpr)
      ) {
        c.width = Math.floor(rect.width * dpr);
        c.height = Math.floor(rect.height * dpr);
      }
      const g = c.getContext("2d")!,
        w = rect.width,
        h = rect.height;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = "#0e1019";
      g.fillRect(0, 0, w, h);
      if (background.complete && background.naturalWidth) {
        g.globalAlpha = 0.28;
        g.drawImage(background, 0, 0, w, h);
        g.globalAlpha = 1;
      }
      if (laneImage.complete && laneImage.naturalWidth) {
        g.globalAlpha = 0.35;
        g.drawImage(laneImage, 0, 0, w, h);
        g.globalAlpha = 1;
      }
      const time = current(e),
        judgementTime = time - settings.offsetMs / 1000,
        target = h - 75,
        speed = 85 + settings.scrollSpeed * 60,
        lw = w / 5;
      for (let i = 0; i < 5; i++) {
        g.fillStyle =
          i < count
            ? ctx.currentTime - e.flash[i] < 0.1
              ? "#303e2b"
              : "#ffffff04"
            : "#05060a99";
        g.fillRect(i * lw + 3, 0, lw - 6, h);
        g.strokeStyle = "#ffffff14";
        g.beginPath();
        g.moveTo(i * lw, 0);
        g.lineTo(i * lw, h);
        g.stroke();
        g.fillStyle = i < count ? colors[i] : "#404252";
        g.font = "600 17px system-ui";
        g.textAlign = "center";
        g.fillText(keyLabel(settings.keybinds[i]), (i + 0.5) * lw, h - 28);
      }
      for (let i = 0; i < chart.notes.length; i++) {
        const n = chart.notes[i];
        if (e.judged.has(i)) continue;
        if (n.time < judgementTime - WINDOWS.good && !e.paused) {
          e.judged.set(i, "miss");
          e.combo = 0;
          e.feedback = "MISS";
          continue;
        }
        const y = target - (n.time - time) * speed;
        if (y < -20) break;
        if (y > target + 35) continue;
        g.fillStyle = colors[n.lane];
        g.shadowColor = colors[n.lane];
        g.shadowBlur = 12;
        g.beginPath();
        g.roundRect(n.lane * lw + 12, y - 6, lw - 24, 12, 4);
        g.fill();
        g.shadowBlur = 0;
      }
      g.strokeStyle = "#c7ff5e";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(0, target);
      g.lineTo(w, target);
      g.stroke();
      g.textAlign = "center";
      g.font = "700 18px system-ui";
      g.fillStyle = "#c7ff5e";
      g.fillText(
        time < 0 ? `READY ${Math.ceil(-time)}` : e.feedback,
        w / 2,
        h * 0.25,
      );
      if (e.paused) {
        g.fillStyle = "#080a12bc";
        g.fillRect(0, 0, w, h);
        g.fillStyle = "white";
        g.font = "600 32px system-ui";
        g.fillText("Paused", w / 2, h / 2);
      }
      if (time >= track.duration && !e.finished) void finish(e);
      if (performance.now() - lastHud > 80) {
        const s = summarize(e.judged, Math.max(1, e.judged.size), e.maxCombo);
        setState((v) => ({
          ...v,
          time,
          score: s.score,
          combo: e.combo,
          accuracy: s.accuracy,
        }));
        lastHud = performance.now();
      }
      raf = requestAnimationFrame(draw);
    }
    window.render_game_to_text = () => {
      const e = engine.current;
      return JSON.stringify({
        mode: e?.finished ? "result" : e?.paused ? "paused" : "playing",
        coordinateSystem:
          "five lanes left-to-right 0–4; time in seconds; notes descend to bottom judgement line",
        time: e ? current(e) : 0,
        activeLanes: count,
        combo: e?.combo || 0,
        score: e
          ? summarize(e.judged, chart.notes.length, e.maxCombo).score
          : 0,
        notes: chart.notes
          .filter(
            (n, i) =>
              e &&
              !e.judged.has(i) &&
              n.time > current(e) - 0.15 &&
              n.time < current(e) + 2,
          )
          .slice(0, 20),
      });
    };
    if (import.meta.env.DEV)
      window.advanceTime = (ms: number) => {
        const e = engine.current;
        if (e && !e.paused && !e.finished) e.virtual += ms / 1000;
      };
    void (async () => {
      try {
        await ctx.resume();
        const buffer = track.id.startsWith("demo-")
          ? synthesize(track, ctx)
          : await ctx.decodeAudioData(await getAudio(track.id));
        if (canceled) return;
        const gain = ctx.createGain();
        gain.gain.value = settings.volume;
        gain.connect(ctx.destination);
        const e: Engine = {
          ctx,
          buffer,
          source: null,
          gain,
          start: 0,
          position: -2,
          paused: false,
          finished: false,
          judged: new Map(),
          combo: 0,
          maxCombo: 0,
          feedback: "FIND YOUR FLOW",
          flash: [-1, -1, -1, -1, -1],
          virtual: 0,
        };
        engine.current = e;
        play(e);
        setState((s) => ({ ...s, loading: false }));
        window.addEventListener("keydown", key);
        canvas.current?.addEventListener("pointerdown", touch);
        raf = requestAnimationFrame(draw);
      } catch (error) {
        setState((s) => ({ ...s, loading: false, error: String(error) }));
      }
    })();
    const visibility = () => {
      if (document.hidden && engine.current && !engine.current.paused) pause();
    };
    document.addEventListener("visibilitychange", visibility);
    const toggle = () => pause();
    window.addEventListener("lanes:pause", toggle);
    return () => {
      canceled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", key);
      window.removeEventListener("lanes:pause", toggle);
      document.removeEventListener("visibilitychange", visibility);
      canvas.current?.removeEventListener("pointerdown", touch);
      removeMidi();
      void ctx.close();
      engine.current = null;
      delete window.advanceTime;
      delete window.render_game_to_text;
    };
  }, [track.id, settings, profile, retry]);
  return (
    <section className="game-view">
      <div className="game-top">
        <button className="text-button" onClick={onExit}>
          <ArrowLeft size={18} /> Library
        </button>
        <div>
          <strong>{track.title}</strong>
          <span>
            {settings.difficulty} · {count} lanes
          </span>
        </div>
        <button
          className="secondary"
          onClick={() => window.dispatchEvent(new Event("lanes:pause"))}
        >
          {state.paused ? <Play size={17} /> : <Pause size={17} />}{" "}
          {state.paused ? "Resume" : "Pause"}
        </button>
      </div>
      {state.error ? (
        <div role="alert" className="empty-state">
          {state.error}
          <button onClick={onExit}>Back to library</button>
        </div>
      ) : result ? (
        <div className="results">
          <span className="result-symbol">∿</span>
          <h1>Track complete.</h1>
          <p>
            {track.title} · {settings.difficulty}
          </p>
          <div className="result-score">{result.score.toLocaleString()}</div>
          <div className="result-stats">
            <div>
              <b>{result.accuracy}%</b>
              <span>Accuracy</span>
            </div>
            <div>
              <b>{result.maxCombo}×</b>
              <span>Best combo</span>
            </div>
            <div>
              <b>{result.perfect}</b>
              <span>Perfect</span>
            </div>
            <div>
              <b>{result.good}</b>
              <span>Good</span>
            </div>
            <div>
              <b>{result.miss}</b>
              <span>Miss</span>
            </div>
          </div>
          <div className="button-row">
            <button className="primary" onClick={() => setRetry((n) => n + 1)}>
              <RotateCcw size={17} /> Play again
            </button>
            <button className="secondary" onClick={onExit}>
              Back to library
            </button>
            <button
              className="secondary"
              disabled={sync === "Uploading…"}
              onClick={async () => {
                setSync("Uploading…");
                try {
                  await onSync(result);
                  setSync("Score synced to community leaderboard.");
                } catch (e) {
                  setSync(String(e));
                }
              }}
            >
              <UploadCloud size={17} /> Sync score
            </button>
          </div>
          <p role="status">
            {sync ||
              "Result saved locally. Online scores are community submissions."}
          </p>
        </div>
      ) : (
        <>
          <div className="game-stats">
            <div>
              <span>SCORE</span>
              <b>{state.score.toLocaleString()}</b>
            </div>
            <div>
              <span>COMBO</span>
              <b>{state.combo}×</b>
            </div>
            <div>
              <span>ACCURACY</span>
              <b>{state.accuracy}%</b>
            </div>
          </div>
          <div className="highway-container">
            <canvas
              ref={canvas}
              aria-label="Five-lane rhythm highway. Use configured keys or MIDI notes to hit descending notes."
            />
            {state.loading ? (
              <div className="loading">Preparing audio…</div>
            ) : null}
          </div>
          <div className="game-progress">
            <span>{formatTime(Math.max(0, state.time))}</span>
            <progress value={state.time} max={track.duration} />
            <span>{formatTime(track.duration)}</span>
          </div>
          <p className="game-help">
            Hit notes as they cross the lime line · Esc to pause · Tap lanes to
            play
          </p>
        </>
      )}
    </section>
  );
}
