import type { CSSProperties, ReactNode } from "react";
import {
  difficulties,
  laneCounts,
  type Difficulty,
  type Track,
} from "../shared/model";
export const formatTime = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
export const keyLabel = (s: string) =>
  s
    .replace(/^Key|^Digit/, "")
    .replace("Space", "␣")
    .replace("Arrow", "");
export function Cover({
  track,
  large = false,
}: {
  track: Track;
  large?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`cover art-${track.art} ${large ? "large" : ""}`}
    >
      <span className="cover-mark">∿</span>
    </div>
  );
}
export function Heading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}
export function DifficultyPicker({
  value,
  onChange,
}: {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
}) {
  return (
    <div className="difficulty" aria-label="Difficulty">
      {difficulties.map((d) => (
        <button
          key={d}
          aria-pressed={value === d}
          className={value === d ? "selected" : ""}
          onClick={() => onChange(d)}
        >
          {d[0].toUpperCase() + d.slice(1)}
        </button>
      ))}
    </div>
  );
}
export function LanePreview({
  difficulty,
  keys,
  skin,
}: {
  difficulty: Difficulty;
  keys: string[];
  skin?: string;
}) {
  return (
    <div className="lane-preview">
      <div
        className="mini-highway"
        style={
          skin
            ? {
                backgroundImage: `linear-gradient(#10121c33,#10121c33),url("${skin}")`,
              }
            : undefined
        }
      >
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className={`mini-lane ${i >= laneCounts[difficulty] ? "inactive" : ""}`}
          >
            <i
              style={
                {
                  top: `${12 + ((i * 19) % 55)}%`,
                  "--lane-color": colors[i],
                } as CSSProperties
              }
            />
            <i
              style={
                {
                  top: `${65 + ((i * 7) % 27)}%`,
                  "--lane-color": colors[i],
                } as CSSProperties
              }
            />
          </div>
        ))}
      </div>
      <div className="keycaps">
        {keys.map((k, i) => (
          <kbd className={i >= laneCounts[difficulty] ? "muted" : ""} key={i}>
            {keyLabel(k)}
          </kbd>
        ))}
      </div>
    </div>
  );
}
export const colors = ["#6694ff", "#94f56e", "#bf72fa", "#d4ff65", "#7794ff"];
