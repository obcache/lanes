import { useState } from "react";
import { Plus, Play, ListMusic, ArrowUp, ArrowDown, X } from "lucide-react";
import type { Playlist, Track } from "../shared/model";
import { Cover, formatTime, Heading } from "./ui";
export default function Playlists({
  playlists,
  tracks,
  onChange,
  onPlay,
}: {
  playlists: Playlist[];
  tracks: Track[];
  onChange: (p: Playlist[]) => void;
  onPlay: (t: Track[]) => void;
}) {
  const [name, setName] = useState(""),
    [selected, setSelected] = useState(""),
    [create, setCreate] = useState(false);
  const current = playlists.find((p) => p.id === selected) || playlists[0];
  function update(p: Playlist) {
    onChange(playlists.map((x) => (x.id === p.id ? p : x)));
  }
  return (
    <main className="full-page">
      <Heading
        title="Your playlists"
        description="Build a set. Find your pace."
        action={
          <button className="primary" onClick={() => setCreate(!create)}>
            <Plus size={18} /> New playlist
          </button>
        }
      />
      {create ? (
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            const p = {
              id: crypto.randomUUID(),
              name: name.trim(),
              trackIds: [],
            };
            onChange([...playlists, p]);
            setSelected(p.id);
            setName("");
            setCreate(false);
          }}
        >
          <label>
            Playlist name
            <input
              aria-label="Playlist name"
              autoFocus
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              placeholder="Late-night session"
              required
            />
          </label>
          <button className="primary">Create playlist</button>
        </form>
      ) : null}
      <div className="playlist-layout">
        <nav className="playlist-list">
          {playlists.map((p) => (
            <button
              key={p.id}
              className={current?.id === p.id ? "active" : ""}
              onClick={() => setSelected(p.id)}
            >
              <ListMusic size={20} />
              <span>
                <strong>{p.name}</strong>
                <small>{p.trackIds.length} tracks</small>
              </span>
            </button>
          ))}
        </nav>
        <section className="playlist-content">
          {current ? (
            <>
              <div className="section-heading">
                <div>
                  <h2>{current.name}</h2>
                  <p>{current.trackIds.length} tracks · saved on this device</p>
                </div>
                <button
                  className="primary"
                  disabled={!current.trackIds.length}
                  onClick={() =>
                    onPlay(
                      current.trackIds
                        .map((id) => tracks.find((t) => t.id === id))
                        .filter(Boolean) as Track[],
                    )
                  }
                >
                  <Play size={16} /> Play playlist
                </button>
              </div>
              {current.trackIds.map((id, i) => {
                const track = tracks.find((t) => t.id === id);
                return track ? (
                  <div className="playlist-track" key={id}>
                    <Cover track={track} />
                    <span className="grow">
                      <strong>{track.title}</strong>
                      <small>{formatTime(track.duration)}</small>
                    </span>
                    <button
                      aria-label={`Move ${track.title} up`}
                      disabled={i === 0}
                      onClick={() => {
                        const ids = [...current.trackIds];
                        [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]];
                        update({ ...current, trackIds: ids });
                      }}
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      aria-label={`Move ${track.title} down`}
                      disabled={i === current.trackIds.length - 1}
                      onClick={() => {
                        const ids = [...current.trackIds];
                        [ids[i + 1], ids[i]] = [ids[i], ids[i + 1]];
                        update({ ...current, trackIds: ids });
                      }}
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      aria-label={`Remove ${track.title} from playlist`}
                      onClick={() =>
                        update({
                          ...current,
                          trackIds: current.trackIds.filter((x) => x !== id),
                        })
                      }
                    >
                      <X size={17} />
                    </button>
                  </div>
                ) : null;
              })}
              <label className="add-track">
                Add from your library
                <select
                  aria-label="Add track to playlist"
                  value=""
                  onChange={(e) => {
                    if (e.target.value)
                      update({
                        ...current,
                        trackIds: [...current.trackIds, e.target.value],
                      });
                  }}
                >
                  <option value="">Choose a track…</option>
                  {tracks
                    .filter((t) => !current.trackIds.includes(t.id))
                    .map((t) => (
                      <option value={t.id} key={t.id}>
                        {t.title}
                      </option>
                    ))}
                </select>
              </label>
            </>
          ) : (
            <div className="empty-state">
              <ListMusic size={38} />
              <h2>A good session starts with a playlist.</h2>
              <p>Create one and add tracks from your library.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
