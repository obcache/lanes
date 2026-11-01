import { useCallback, useEffect, useRef, useState } from "react";
import {
  Music2,
  ListMusic,
  Trophy,
  UserRound,
  Settings as SettingsIcon,
  CheckCircle2,
  Minus,
  Square,
  X,
  ChevronRight,
} from "lucide-react";
import {
  defaults,
  fallbackProfile,
  LibrarySchema,
  PlaylistsSchema,
  ProfileSchema,
  SettingsSchema,
  RunsSchema,
  type Track,
  type Settings,
  type Profile,
  type Playlist,
  type Run,
} from "./shared/model";
import { loadState, writeStore, importMusic, api, hash } from "./core/storage";
import Library from "./components/Library";
import Playlists from "./components/Playlists";
import SettingsPage from "./components/Settings";
import ProfilePage from "./components/Profile";
import Leaderboards from "./components/Leaderboards";
import Game from "./components/Game";
import {
  connectMidi,
  disconnectMidi,
  isMidiPermissionError,
  useMidiError,
} from "./core/midi";
import { MidiAccessNotice } from "./components/MidiAccess";
type State = {
  settings: Settings;
  tracks: Track[];
  playlists: Playlist[];
  profile: Profile;
  runs: Run[];
};
const nav = [
  ["library", "Library", Music2],
  ["playlists", "Playlists", ListMusic],
  ["leaderboards", "Leaderboards", Trophy],
  ["profile", "Profile", UserRound],
  ["settings", "Settings", SettingsIcon],
] as const;
export default function App() {
  const [state, setState] = useState<State>({
      settings: defaults,
      tracks: [],
      playlists: [],
      profile: fallbackProfile,
      runs: [],
    }),
    [ready, setReady] = useState(false),
    [fatal, setFatal] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(""),
    [selected, setSelected] = useState("demo-glass"),
    [playing, setPlaying] = useState<Track | null>(null),
    [queue, setQueue] = useState<Track[]>([]),
    [saveStatus, setSaveStatus] = useState("Changes saved locally.");
  const [deviceAccessOpen, setDeviceAccessOpen] = useState(false),
    midiError = useMidiError();
  const stateRef = useRef(state);
  stateRef.current = state;
  const notify = useCallback((s: string) => setMessage(s), []);
  useEffect(() => {
    if (!state.settings.midiAccessAllowed) {
      disconnectMidi();
      return;
    }
    if (ready && state.settings.midiEnabled)
      void connectMidi().catch((error) => {
        if (!isMidiPermissionError(error))
          notify(`MIDI connection: ${String(error)}`);
      });
  }, [
    ready,
    state.settings.midiEnabled,
    state.settings.midiAccessAllowed,
    notify,
  ]);
  useEffect(() => {
    void loadState()
      .then((s) => {
        setState(s);
        setReady(true);
      })
      .catch((e) =>
        setFatal(
          `Local data could not be opened: ${String(e)}. Existing files have been preserved.`,
        ),
      );
  }, []);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 6500);
    return () => clearTimeout(t);
  }, [message]);
  const save = useCallback(
    (name: Parameters<typeof writeStore>[0], value: unknown) => {
      setSaveStatus("Saving locally…");
      return writeStore(name, value)
        .then(() => setSaveStatus("Changes saved locally."))
        .catch((e) => {
          setSaveStatus("Could not save local changes.");
          notify(`Could not save: ${String(e)}`);
        });
    },
    [notify],
  );
  const changeSettings = useCallback(
    (settings: Settings) => {
      setState((s) => ({ ...s, settings }));
      return save("settings", settings);
    },
    [save],
  );
  function openMidiAccess() {
    setPlaying(null);
    setDeviceAccessOpen(true);
    void changeSettings({ ...stateRef.current.settings, lastPage: "settings" });
  }
  async function retryMidi() {
    try {
      await connectMidi();
      await changeSettings({ ...stateRef.current.settings, midiEnabled: true });
      notify("MIDI access granted. Choose your controller in Settings.");
    } catch (error) {
      if (!isMidiPermissionError(error)) notify(String(error));
    }
  }
  const changeProfile = useCallback(
    (patch: Partial<Profile>) => {
      const profile = { ...stateRef.current.profile, ...patch };
      stateRef.current = { ...stateRef.current, profile };
      setState((s) => ({ ...s, profile }));
      save("profile", profile);
    },
    [save],
  );
  const changePlaylists = useCallback(
    (playlists: Playlist[]) => {
      setState((s) => ({ ...s, playlists }));
      save("playlists", { schemaVersion: 1, playlists });
    },
    [save],
  );
  const sync = useCallback(async (run: Run) => {
    const s = stateRef.current,
      t = s.tracks.find((t) => t.id === run.trackId);
    if (!t) throw Error("Track no longer exists.");
    const serializedChart = JSON.stringify(t.charts[run.difficulty]);
    await api(s.settings.apiUrl, "/charts", "POST", {
      trackId: t.id,
      title: t.title,
      artist: t.artist,
      duration: t.duration,
      chartHash: await hash(serializedChart),
      chart: t.charts[run.difficulty],
      serializedChart,
    });
    await api(s.settings.apiUrl, "/runs", "POST", run);
  }, []);
  const complete = useCallback(
    async (run: Run) => {
      const runs = [...stateRef.current.runs, run].slice(-2000);
      await writeStore("runs", { schemaVersion: 1, runs });
      setState((s) => ({ ...s, runs }));
      if (stateRef.current.settings.apiUrl) {
        try {
          await sync(run);
        } catch (error) {
          notify(`Result saved locally. Online sync: ${String(error)}`);
        }
      }
    },
    [sync, notify],
  );
  async function imports(files: FileList) {
    if (busy) return;
    for (const file of Array.from(files)) {
      try {
        const track = await importMusic(file, setBusy);
        const tracks = stateRef.current.tracks;
        if (tracks.some((t) => t.id === track.id)) {
          notify(`${track.title} is already in your library.`);
          continue;
        }
        const updated = [...tracks, track];
        await writeStore("library", { schemaVersion: 1, tracks: updated });
        stateRef.current = { ...stateRef.current, tracks: updated };
        setState(stateRef.current);
        setSelected(track.id);
        notify(`${track.title} imported. Four difficulty maps are ready.`);
      } catch (e) {
        notify(String(e));
      }
    }
    setBusy("");
  }
  async function exportData() {
    try {
      const s = stateRef.current,
        data = JSON.stringify(
          {
            schemaVersion: 1,
            settings: s.settings,
            library: { schemaVersion: 1, tracks: s.tracks },
            playlists: { schemaVersion: 1, playlists: s.playlists },
            profile: s.profile,
            runs: { schemaVersion: 1, runs: s.runs },
          },
          null,
          2,
        );
      if (window.lanes) await window.lanes.exportData(data);
      else {
        const a = document.createElement("a"),
          url = URL.createObjectURL(
            new Blob([data], { type: "application/json" }),
          );
        a.href = url;
        a.download = "lanes-backup-v1.json";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      notify("JSON export prepared. Audio stays in local storage.");
    } catch (e) {
      notify(String(e));
    }
  }
  async function importData() {
    try {
      let text: string | null = null;
      if (window.lanes) text = await window.lanes.importData();
      else {
        text = await new Promise<string | null>((resolve) => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".json";
          input.onchange = () => {
            const f = input.files?.[0];
            if (!f) return resolve(null);
            if (f.size > 30 * 1024 * 1024) {
              notify("Choose JSON smaller than 30 MB.");
              resolve(null);
              return;
            }
            void f.text().then(resolve);
          };
          input.oncancel = () => resolve(null);
          input.click();
        });
      }
      if (!text) return;
      const raw = JSON.parse(text);
      if (raw.schemaVersion !== 1) throw Error("Unsupported backup version.");
      const settings = SettingsSchema.parse(raw.settings),
        library = LibrarySchema.parse(raw.library),
        playlists = PlaylistsSchema.parse(raw.playlists),
        profile = ProfileSchema.parse(raw.profile),
        runs = RunsSchema.parse(raw.runs);
      if (
        window.lanes &&
        raw.library.tracks.some((t: Track) => !t.id.startsWith("demo-"))
      )
        notify(
          "Imported metadata references local media. Keep the media folder or reimport missing audio.",
        );
      await Promise.all([
        writeStore("settings", settings),
        writeStore("library", library),
        writeStore("playlists", playlists),
        writeStore("profile", profile),
        writeStore("runs", runs),
      ]);
      setState({
        settings,
        tracks: library.tracks,
        playlists: playlists.playlists,
        profile,
        runs: runs.runs,
      });
      notify("Local JSON backup imported.");
    } catch (e) {
      notify(`Import failed: ${String(e)}`);
    }
  }
  const page = state.settings.lastPage;
  if (fatal)
    return (
      <div className="startup-error" role="alert">
        <h1>We couldn't open your workspace.</h1>
        <p>{fatal}</p>
      </div>
    );
  if (!ready)
    return (
      <div className="loading-screen">
        <img src="./icon.svg" width="64" />
        <p>Opening your library…</p>
      </div>
    );
  return (
    <div className="app">
      <div className="titlebar">
        <span>
          LANES <small> / {playing ? "NOW PLAYING" : page.toUpperCase()}</small>
        </span>
        {window.lanes ? (
          <div className="window-controls">
            <button
              aria-label="Minimize"
              onClick={() => window.lanes?.window("minimize")}
            >
              <Minus size={15} />
            </button>
            <button
              aria-label="Maximize"
              onClick={() => window.lanes?.window("maximize")}
            >
              <Square size={12} />
            </button>
            <button
              aria-label="Close"
              onClick={() => window.lanes?.window("close")}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <span className="preview-label">Browser preview</span>
        )}
      </div>
      <div className="app-body">
        <aside className="sidebar">
          <button
            className="brand"
            aria-label="LANES library"
            onClick={() => {
              setPlaying(null);
              changeSettings({ ...state.settings, lastPage: "library" });
            }}
          >
            <img src="./icon.svg" alt="" />
            <span>
              lanes<span className="brand-dot">.</span>
            </span>
          </button>
          <nav>
            {nav.map(([id, label, Icon]) => (
              <button
                key={id}
                aria-label={label}
                className={page === id && !playing ? "active" : ""}
                onClick={() => {
                  setPlaying(null);
                  setQueue([]);
                  changeSettings({ ...state.settings, lastPage: id });
                }}
              >
                <Icon size={20} />
                <span>{label}</span>
                {page === id && !playing ? <span className="nav-dot" /> : null}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="local-tag">
              <span />{" "}
              {state.settings.apiUrl ? "Server configured" : "Local workspace"}
            </div>
            <button
              className="player-profile"
              onClick={() =>
                changeSettings({ ...state.settings, lastPage: "profile" })
              }
            >
              <div className="small-avatar">
                {state.profile.displayName[0].toUpperCase()}
              </div>
              <span>
                <strong>{state.profile.displayName}</strong>
                <small>{state.runs.length} sessions played</small>
              </span>
              <ChevronRight size={15} />
            </button>
          </div>
        </aside>
        <div className="workspace">
          <MidiAccessNotice
            error={midiError}
            onOpen={openMidiAccess}
            onRetry={retryMidi}
          />
          {playing ? (
            <>
              <Game
                key={playing.id}
                track={playing}
                settings={state.settings}
                profile={state.profile}
                onExit={() => setPlaying(null)}
                onComplete={complete}
                onSync={sync}
              />
              {queue.length ? (
                <button
                  className="next-track secondary"
                  onClick={() => {
                    setPlaying(queue[0]);
                    setQueue(queue.slice(1));
                  }}
                >
                  Next track: {queue[0].title}
                  <ChevronRight size={16} />
                </button>
              ) : null}
            </>
          ) : page === "library" ? (
            <Library
              tracks={state.tracks}
              settings={state.settings}
              profile={state.profile}
              onImport={imports}
              busy={busy}
              selected={selected}
              setSelected={setSelected}
              onFavorite={(id) => {
                const tracks = state.tracks.map((t) =>
                  t.id === id ? { ...t, favorite: !t.favorite } : t,
                );
                setState((s) => ({ ...s, tracks }));
                save("library", { schemaVersion: 1, tracks });
              }}
              onDifficulty={(difficulty) =>
                changeSettings({ ...state.settings, difficulty })
              }
              onPlay={(t) => {
                setQueue([]);
                setPlaying(t);
              }}
            />
          ) : page === "playlists" ? (
            <Playlists
              playlists={state.playlists}
              tracks={state.tracks}
              onChange={changePlaylists}
              onPlay={(tracks) => {
                setQueue(tracks.slice(1));
                setPlaying(tracks[0]);
              }}
            />
          ) : page === "settings" ? (
            <SettingsPage
              settings={state.settings}
              onChange={changeSettings}
              notify={notify}
              onExport={exportData}
              onImport={importData}
              deviceAccessOpen={deviceAccessOpen}
              onOpenDeviceAccess={() => setDeviceAccessOpen(true)}
            />
          ) : page === "profile" ? (
            <ProfilePage
              profile={state.profile}
              settings={state.settings}
              runs={state.runs}
              onChange={changeProfile}
              notify={notify}
            />
          ) : (
            <Leaderboards settings={state.settings} tracks={state.tracks} />
          )}
        </div>
      </div>
      <footer className="statusbar">
        <span>
          <CheckCircle2 size={13} /> Local library
        </span>
        <i />
        <span>{saveStatus}</span>
        <span className="status-right">5 lanes. Infinite rhythm.</span>
      </footer>
      {message ? (
        <div role="status" className="toast">
          <CheckCircle2 size={18} />
          <span>{message}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setMessage("")}
          >
            <X size={15} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
