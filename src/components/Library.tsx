import { useMemo, useRef, useState } from "react";
import {
  Plus,
  Search,
  Heart,
  Play,
  Music2,
  Check,
  ChevronRight,
} from "lucide-react";
import type { Track, Settings, Profile, Difficulty } from "../shared/model";
import {
  Cover,
  DifficultyPicker,
  formatTime,
  Heading,
  LanePreview,
} from "./ui";
export default function Library({
  tracks,
  settings,
  profile,
  onImport,
  onFavorite,
  onDifficulty,
  onPlay,
  selected,
  setSelected,
  busy,
}: {
  tracks: Track[];
  settings: Settings;
  profile: Profile;
  onImport: (files: FileList) => void;
  onFavorite: (id: string) => void;
  onDifficulty: (d: Difficulty) => void;
  onPlay: (track: Track) => void;
  selected: string;
  setSelected: (s: string) => void;
  busy: string;
}) {
  const [query, setQuery] = useState(""),
    [favorites, setFavorites] = useState(false),
    input = useRef<HTMLInputElement>(null);
  const filtered = useMemo(
    () =>
      tracks.filter(
        (t) =>
          (!favorites || t.favorite) &&
          `${t.title} ${t.artist}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [tracks, query, favorites],
  );
  const track = tracks.find((t) => t.id === selected) || tracks[0];
  return (
    <div className="library-layout">
      <main className="library-main">
        <Heading
          title="Your library"
          description="Your music. Your rhythm."
          action={
            <button
              className="primary"
              disabled={!!busy}
              onClick={() => input.current?.click()}
            >
              <Plus size={20} /> Import music
            </button>
          }
        />
        <input
          aria-label="Import music files"
          hidden
          ref={input}
          type="file"
          accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a"
          multiple
          onChange={(e) => {
            if (e.target.files) onImport(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="flow-banner">
          <h2>Find your flow.</h2>
          <p>Every track becomes your playground.</p>
          <span className="banner-bars" aria-hidden="true">
            ▰ ▰ ▰ ▰ ▰
          </span>
        </div>
        {busy ? (
          <div role="status" className="import-progress">
            <span className="spinner" />
            {busy}
          </div>
        ) : null}
        <div className="library-toolbar">
          <label className="search">
            <Search size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tracks…"
              aria-label="Search tracks"
            />
          </label>
          <div className="segmented">
            <button
              className={!favorites ? "selected" : ""}
              onClick={() => setFavorites(false)}
            >
              All tracks <small>{tracks.length}</small>
            </button>
            <button
              className={favorites ? "selected" : ""}
              onClick={() => setFavorites(true)}
            >
              Favorites
            </button>
          </div>
        </div>
        <div className="track-table">
          <div className="track-head">
            <span>SONG</span>
            <span>LENGTH</span>
            <span>BPM</span>
            <span>MAPS</span>
            <span />
          </div>
          {filtered.map((t) => (
            <div
              key={t.id}
              className={`track-row ${track?.id === t.id ? "active" : ""}`}
            >
              <button
                className="track-select"
                aria-label={`Select ${t.title}`}
                onClick={() => setSelected(t.id)}
              >
                <Cover track={t} />
                <span>
                  <strong>{t.title}</strong>
                  <small>{t.artist}</small>
                </span>
                {track?.id === t.id ? (
                  <span className="playing-bars">
                    <i />
                    <i />
                    <i />
                  </span>
                ) : null}
              </button>
              <span>{formatTime(t.duration)}</span>
              <span>{t.bpm || "—"}</span>
              <span className="map-indicator" aria-label="4 maps generated">
                {[0, 1, 2, 3].map((n) => (
                  <i key={n} style={{ opacity: 1 - n * 0.16 }} />
                ))}
              </span>
              <button
                className={`favorite ${t.favorite ? "is-favorite" : ""}`}
                aria-label={`${t.favorite ? "Unfavorite" : "Favorite"} ${t.title}`}
                onClick={() => onFavorite(t.id)}
              >
                <Heart size={18} fill={t.favorite ? "currentColor" : "none"} />
              </button>
            </div>
          ))}
        </div>
        {!filtered.length ? (
          <div className="empty-state">
            <Music2 />
            <h3>
              {query ? "No matching tracks" : "Make room for your music."}
            </h3>
            <p>
              {query
                ? "Try a different title or artist."
                : "Import audio to generate all four difficulty maps."}
            </p>
          </div>
        ) : null}
        <div className="library-note">
          <Check size={14} />
          <span>
            Four difficulty maps. Automatically made for every import.
          </span>
        </div>
      </main>
      <aside className="track-detail">
        {track ? (
          <>
            <Cover track={track} large />
            <div className="detail-title">
              <h2>{track.title}</h2>
              <p>{track.artist}</p>
            </div>
            <div className="track-metrics">
              <div>
                <strong>{formatTime(track.duration)}</strong>
                <small>LENGTH</small>
              </div>
              <div>
                <strong>{track.bpm || "—"}</strong>
                <small>BPM</small>
              </div>
              <div>
                <strong>4</strong>
                <small>MAPS</small>
              </div>
            </div>
            <DifficultyPicker
              value={settings.difficulty}
              onChange={onDifficulty}
            />
            <div className="difficulty-info">
              <span>
                {settings.difficulty[0].toUpperCase() +
                  settings.difficulty.slice(1)}
              </span>
              <span>
                {track.charts[settings.difficulty].notes.length} notes{" "}
                <ChevronRight size={12} />
              </span>
            </div>
            <LanePreview
              difficulty={settings.difficulty}
              keys={settings.keybinds}
              skin={profile.laneSkin}
            />
            <button
              className="primary play-button"
              onClick={() => onPlay(track)}
            >
              <Play size={18} fill="currentColor" /> Play track
            </button>
            <p className="detail-hint">
              {track.id.startsWith("demo-")
                ? "Original practice track · ready to play"
                : "Analyzed locally · audio stays on this device"}
            </p>
          </>
        ) : null}
      </aside>
    </div>
  );
}
