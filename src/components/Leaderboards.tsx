import { useEffect, useState } from "react";
import { Trophy, RefreshCw, WifiOff } from "lucide-react";
import {
  difficulties,
  type Settings,
  type Track,
  type Difficulty,
} from "../shared/model";
import { api, hash } from "../core/storage";
import { DifficultyPicker, Heading } from "./ui";
export default function Leaderboards({
  settings,
  tracks,
}: {
  settings: Settings;
  tracks: Track[];
}) {
  const [track, setTrack] = useState(tracks[0]?.id || ""),
    [difficulty, setDifficulty] = useState<Difficulty>(settings.difficulty),
    [rows, setRows] = useState<any[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [reload, setReload] = useState(0);
  useEffect(() => {
    let canceled = false;
    setError("");
    setRows([]);
    if (!settings.apiUrl) {
      setError("Connect a server in Settings to see community leaderboards.");
      return;
    }
    setLoading(true);
    const selected = tracks.find((t) => t.id === track);
    if (!selected) {
      setLoading(false);
      return;
    }
    hash(JSON.stringify(selected.charts[difficulty]))
      .then((chartHash) =>
        api(
          settings.apiUrl,
          `/leaderboards?track=${encodeURIComponent(track)}&difficulty=${difficulties.includes(difficulty) ? difficulty : "expert"}&chartHash=${chartHash}`,
        ),
      )
      .then((data) => {
        if (!canceled) setRows(data.entries);
      })
      .catch((e) => {
        if (!canceled) setError(String(e));
      })
      .finally(() => {
        if (!canceled) setLoading(false);
      });
    return () => {
      canceled = true;
    };
  }, [track, difficulty, settings.apiUrl, reload, tracks]);
  return (
    <main className="full-page">
      <Heading
        title="Find your place."
        description="One track. A thousand ways to feel it."
        action={
          <button className="secondary" onClick={() => setReload((n) => n + 1)}>
            <RefreshCw size={16} /> Refresh
          </button>
        }
      />
      <div className="leaderboard-filters">
        <label>
          Track
          <select value={track} onChange={(e) => setTrack(e.target.value)}>
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </label>
        <DifficultyPicker value={difficulty} onChange={setDifficulty} />
      </div>
      {error ? (
        <div className="empty-state">
          <WifiOff size={38} />
          <h2>Meet you online.</h2>
          <p role="status">{error}</p>
        </div>
      ) : loading ? (
        <p role="status">Loading leaderboard…</p>
      ) : !rows.length ? (
        <div className="empty-state">
          <Trophy size={38} />
          <h2>The first score could be yours.</h2>
          <p>Complete this track and sync your result to join the board.</p>
        </div>
      ) : (
        <div className="leaderboard">
          <div className="leader-row header">
            <span>RANK</span>
            <span>PLAYER</span>
            <span>SCORE</span>
            <span>ACCURACY</span>
          </div>
          {rows.map((r, i) => (
            <div className="leader-row" key={r.id}>
              <strong className={i < 3 ? "lime" : ""}>
                {String(i + 1).padStart(2, "0")}
              </strong>
              <span>{r.displayName}</span>
              <strong>{Number(r.score).toLocaleString()}</strong>
              <span>{r.accuracy}%</span>
            </div>
          ))}
        </div>
      )}
      <p className="muted leaderboard-note">
        Community scores are submitted by players and are unverified. Boards
        compare the same versioned chart and difficulty.
      </p>
    </main>
  );
}
