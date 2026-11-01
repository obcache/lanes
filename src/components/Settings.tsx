import { useEffect, useRef, useState } from "react";
import {
  Cable,
  Download,
  Upload,
  Keyboard,
  Radio,
  FolderLock,
} from "lucide-react";
import { SettingsSchema, type Settings as SettingsType } from "../shared/model";
import {
  connectMidi,
  onMidi,
  useMidiDevices,
  useMidiConnected,
  isMidiPermissionError,
} from "../core/midi";
import { Heading, keyLabel } from "./ui";
import Calibration from "./Calibration";
import { MidiDeviceAccess } from "./MidiAccess";
export default function Settings({
  settings,
  onChange,
  notify,
  onExport,
  onImport,
  deviceAccessOpen,
  onOpenDeviceAccess,
}: {
  settings: SettingsType;
  onChange: (s: SettingsType) => void;
  notify: (s: string) => void;
  onExport: () => void;
  onImport: () => void;
  deviceAccessOpen: boolean;
  onOpenDeviceAccess: () => void;
}) {
  const [learn, setLearn] = useState<{
      lane: number;
      mode: "key" | "midi";
    } | null>(null),
    [server, setServer] = useState(settings.apiUrl),
    [midiStatus, setMidiStatus] = useState(
      "Connect a MIDI controller to map and play.",
    ),
    devices = useMidiDevices(),
    connected = useMidiConnected(),
    latest = useRef(settings);
  latest.current = settings;
  async function connect() {
    try {
      await connectMidi();
      onChange({ ...latest.current, midiEnabled: true });
    } catch (error) {
      setMidiStatus(
        isMidiPermissionError(error)
          ? "MIDI permission was denied. Open device access settings above to allow it."
          : String(error),
      );
    }
  }
  useEffect(() => {
    if (!learn) return;
    const timer = setTimeout(() => setLearn(null), 10000);
    const save = (value: string | number) => {
      const s = latest.current;
      const next = {
        ...s,
        [learn.mode === "key" ? "keybinds" : "midiNotes"]: (learn.mode === "key"
          ? s.keybinds
          : s.midiNotes
        ).map((n, i) => (i === learn.lane ? value : n)),
      };
      const parsed = SettingsSchema.safeParse(next);
      if (parsed.success) {
        onChange(parsed.data);
        notify(`Lane ${learn.lane + 1} mapped.`);
      } else notify("Choose a unique supported key or MIDI note.");
      setLearn(null);
    };
    const key = (e: KeyboardEvent) => {
      if (learn.mode !== "key" || e.repeat) return;
      e.preventDefault();
      if (e.code === "Escape") {
        setLearn(null);
        return;
      }
      save(e.code);
    };
    const remove = onMidi((data, device) => {
      if (
        learn.mode === "midi" &&
        (data[0] & 0xf0) === 0x90 &&
        data[2] > 0 &&
        (latest.current.midiChannel === "all" ||
          (data[0] & 0x0f) + 1 === latest.current.midiChannel) &&
        (latest.current.midiDevice === "all" ||
          device === latest.current.midiDevice)
      )
        save(data[1]);
    });
    window.addEventListener("keydown", key);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", key);
      remove();
    };
  }, [learn, onChange, notify]);
  return (
    <main className="full-page settings-page">
      <Heading
        title="Make it feel right."
        description="Your setup. Your timing. Your way to play."
      />
      <section className="settings-section">
        <div className="section-heading">
          <div>
            <h2>
              <Keyboard size={20} /> Input & keybinds
            </h2>
            <p>Five lanes, ready for a keyboard or your MIDI controller.</p>
          </div>
          <button className="secondary" onClick={connect}>
            <Cable size={17} /> Connect MIDI
          </button>
        </div>
        <button
          className="text-button"
          onClick={onOpenDeviceAccess}
          aria-expanded={deviceAccessOpen}
        >
          Device access settings
        </button>
        {deviceAccessOpen ? (
          <MidiDeviceAccess
            settings={settings}
            onChange={onChange}
            onRetry={connect}
          />
        ) : null}
        <div className="mapping-table">
          <div className="mapping-head">
            <span>LANE</span>
            <span>KEYBOARD</span>
            <span>MIDI NOTE</span>
          </div>
          {settings.keybinds.map((key, i) => (
            <div className="mapping-row" key={i}>
              <span className={`lane-label lane-${i}`}>{i + 1}</span>
              <button
                onClick={() => setLearn({ lane: i, mode: "key" })}
                className={
                  learn?.lane === i && learn.mode === "key" ? "learning" : ""
                }
              >
                {learn?.lane === i && learn.mode === "key" ? (
                  "Press a key…"
                ) : (
                  <kbd>{keyLabel(key)}</kbd>
                )}
              </button>
              <button
                onClick={() => setLearn({ lane: i, mode: "midi" })}
                className={
                  learn?.lane === i && learn.mode === "midi" ? "learning" : ""
                }
              >
                {learn?.lane === i && learn.mode === "midi"
                  ? "Play a note…"
                  : `Note ${settings.midiNotes[i]}`}
              </button>
            </div>
          ))}
        </div>
        <div className="form-grid">
          <label>
            MIDI input
            <select
              value={settings.midiDevice}
              onChange={(e) =>
                onChange({ ...settings, midiDevice: e.target.value })
              }
            >
              <option value="all">All devices</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            MIDI channel
            <select
              value={settings.midiChannel}
              onChange={(e) =>
                onChange({
                  ...settings,
                  midiChannel:
                    e.target.value === "all" ? "all" : Number(e.target.value),
                })
              }
            >
              <option value="all">All channels</option>
              {Array.from({ length: 16 }, (_, i) => (
                <option value={i + 1} key={i}>
                  {i + 1}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="muted" role="status">
          <Radio size={13} />{" "}
          {connected
            ? "MIDI access granted. Choose an input, then tap a note mapping to learn."
            : midiStatus}
        </p>
      </section>
      <Calibration
        settings={settings}
        onApply={(offsetMs) => {
          onChange({ ...settings, offsetMs });
          notify(`Timing offset saved: ${offsetMs} ms.`);
        }}
      />
      <section className="settings-section">
        <h2>Audio & gameplay</h2>
        <div className="form-grid">
          <label>
            Master volume <output>{Math.round(settings.volume * 100)}%</output>
            <input
              aria-label="Master volume"
              type="range"
              min="0"
              max="1"
              step=".01"
              value={settings.volume}
              onChange={(e) =>
                onChange({ ...settings, volume: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Note speed <output>{settings.scrollSpeed.toFixed(1)}×</output>
            <input
              aria-label="Note speed"
              type="range"
              min="1"
              max="6"
              step=".1"
              value={settings.scrollSpeed}
              onChange={(e) =>
                onChange({ ...settings, scrollSpeed: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Timing offset (ms)
            <input
              type="number"
              min="-250"
              max="250"
              value={settings.offsetMs}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (n >= -250 && n <= 250)
                  onChange({ ...settings, offsetMs: n });
              }}
            />
          </label>
        </div>
      </section>
      <section className="settings-section">
        <h2>Online service</h2>
        <p>
          Connect your organization's LANES PHP server for SSO, profiles, and
          community leaderboards.
        </p>
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            const parsed = SettingsSchema.safeParse({
              ...settings,
              apiUrl: server.replace(/\/$/, ""),
            });
            if (!parsed.success) {
              notify("Use an HTTPS server URL, or HTTP on localhost.");
              return;
            }
            onChange(parsed.data);
            notify("Server connection saved. Sign in from your profile.");
          }}
        >
          <label>
            API base URL
            <input
              aria-label="API base URL"
              type="url"
              placeholder="https://lanes.example.com/api"
              value={server}
              onChange={(e) => setServer(e.target.value)}
            />
          </label>
          <button className="secondary">Save connection</button>
        </form>
      </section>
      <section className="settings-section">
        <div className="section-heading">
          <div>
            <h2>
              <FolderLock size={20} /> Local data
            </h2>
            <p>
              Library, playlists, keybinds, calibration, and workspace layout
              stay on this device.
            </p>
          </div>
        </div>
        <div className="button-row">
          <button className="secondary" onClick={onExport}>
            <Download size={17} /> Export JSON
          </button>
          <button className="secondary" onClick={onImport}>
            <Upload size={17} /> Import JSON
          </button>
        </div>
        <p className="muted">
          Audio files stay in the local media folder. Export includes metadata
          and settings; keep your audio files when moving devices.
        </p>
      </section>
    </main>
  );
}
