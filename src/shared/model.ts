import { z } from "zod";
export const difficulties = ["beginner", "normal", "expert", "pro"] as const;
export type Difficulty = (typeof difficulties)[number];
export const laneCounts: Record<Difficulty, number> = {
  beginner: 3,
  normal: 4,
  expert: 5,
  pro: 5,
};
export const NoteSchema = z.object({
  time: z.number().min(0).max(3600),
  lane: z.number().int().min(0).max(4),
});
export type Note = z.infer<typeof NoteSchema>;
export const ChartSchema = z
  .object({
    version: z.literal(1),
    difficulty: z.enum(difficulties),
    notes: z.array(NoteSchema).max(50000),
  })
  .refine(
    (c) =>
      c.notes.every(
        (n, i) =>
          n.lane < laneCounts[c.difficulty] &&
          (i === 0 || n.time >= c.notes[i - 1].time),
      ),
    "Invalid lane or unsorted notes",
  );
export type Chart = z.infer<typeof ChartSchema>;
export const TrackSchema = z
  .object({
    id: z.string().regex(/^(demo-[a-z]+|[a-f0-9]{64})$/),
    title: z.string().min(1).max(200),
    artist: z.string().max(200),
    duration: z.number().positive().max(1800),
    bpm: z.number().min(0).max(300),
    favorite: z.boolean(),
    art: z.number().int().min(0).max(2),
    importedAt: z.string(),
    charts: z.object({
      beginner: ChartSchema,
      normal: ChartSchema,
      expert: ChartSchema,
      pro: ChartSchema,
    }),
  })
  .refine(
    (track) =>
      difficulties.every(
        (d) =>
          track.charts[d].difficulty === d &&
          track.charts[d].notes.every((n) => n.time <= track.duration),
      ),
    "Chart difficulty or duration mismatch",
  );
export type Track = z.infer<typeof TrackSchema>;
export const SettingsSchema = z.object({
  schemaVersion: z.literal(1),
  offsetMs: z.number().min(-250).max(250),
  volume: z.number().min(0).max(1),
  scrollSpeed: z.number().min(1).max(6),
  keybinds: z
    .array(
      z
        .string()
        .regex(
          /^(Key[A-Z]|Digit[0-9]|Space|Arrow(Left|Right|Up|Down)|Semicolon|Quote|Comma|Period|Slash|BracketLeft|BracketRight)$/,
        ),
    )
    .length(5)
    .refine((v) => new Set(v).size === 5, "Use a unique key for each lane"),
  midiNotes: z
    .array(z.number().int().min(0).max(127))
    .length(5)
    .refine(
      (v) => new Set(v).size === 5,
      "Use a unique MIDI note for each lane",
    ),
  midiChannel: z.union([z.literal("all"), z.number().int().min(1).max(16)]),
  midiDevice: z.string().max(200),
  midiEnabled: z.boolean().default(false),
  midiAccessAllowed: z.boolean().default(true),
  apiUrl: z.union([
    z.literal(""),
    z.url().refine((v) => {
      const u = new URL(v);
      return (
        u.protocol === "https:" ||
        (u.protocol === "http:" &&
          ["localhost", "127.0.0.1"].includes(u.hostname))
      );
    }, "Use HTTPS or local HTTP"),
  ]),
  lastPage: z.enum([
    "library",
    "playlists",
    "leaderboards",
    "profile",
    "settings",
  ]),
  difficulty: z.enum(difficulties),
});
export type Settings = z.infer<typeof SettingsSchema>;
export const defaults: Settings = {
  schemaVersion: 1,
  offsetMs: 0,
  volume: 0.65,
  scrollSpeed: 3,
  keybinds: ["KeyD", "KeyF", "KeyJ", "KeyK", "KeyL"],
  midiNotes: [60, 62, 64, 65, 67],
  midiChannel: "all",
  midiDevice: "all",
  midiEnabled: false,
  midiAccessAllowed: true,
  apiUrl: "",
  lastPage: "library",
  difficulty: "expert",
};
export const LibrarySchema = z.object({
  schemaVersion: z.literal(1),
  tracks: z.array(TrackSchema).max(2000),
});
export const PlaylistsSchema = z.object({
  schemaVersion: z.literal(1),
  playlists: z
    .array(
      z.object({
        id: z.uuid(),
        name: z.string().min(1).max(80),
        trackIds: z.array(z.string().max(80)).max(2000),
      }),
    )
    .max(200),
});
export type Playlist = z.infer<typeof PlaylistsSchema>["playlists"][number];
export const ProfileSchema = z.object({
  schemaVersion: z.literal(1),
  displayName: z.string().min(1).max(60),
  background: z.string().max(8_000_000),
  laneSkin: z.string().max(8_000_000),
});
export type Profile = z.infer<typeof ProfileSchema>;
export const RunSchema = z.object({
  id: z.uuid(),
  trackId: z.string().max(80),
  chartHash: z.string().regex(/^[a-f0-9]{64}$/),
  difficulty: z.enum(difficulties),
  total: z.number().int().positive().max(50000),
  perfect: z.number().int().min(0),
  good: z.number().int().min(0),
  miss: z.number().int().min(0),
  maxCombo: z.number().int().min(0),
  score: z.number().int().min(0),
  accuracy: z.number().min(0).max(100),
  completedAt: z.iso.datetime(),
});
export type Run = z.infer<typeof RunSchema>;
export const RunsSchema = z.object({
  schemaVersion: z.literal(1),
  runs: z.array(RunSchema).max(2000),
});
export const schemas = {
  settings: SettingsSchema,
  library: LibrarySchema,
  playlists: PlaylistsSchema,
  profile: ProfileSchema,
  runs: RunsSchema,
};
export type StoreName = keyof typeof schemas;
export const fallbackProfile: Profile = {
  schemaVersion: 1,
  displayName: "Local player",
  background: "",
  laneSkin: "",
};
export interface DesktopBridge {
  read: (name: StoreName) => Promise<unknown>;
  write: (name: StoreName, value: unknown) => Promise<void>;
  importAudio: (id: string, bytes: ArrayBuffer) => Promise<void>;
  audioUrl: (id: string) => Promise<string>;
  api: (path: string, method: string, body?: unknown) => Promise<unknown>;
  window: (action: "minimize" | "maximize" | "close") => void;
  exportData: (value: string) => Promise<void>;
  importData: () => Promise<string | null>;
}
