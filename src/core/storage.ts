import {
  schemas,
  defaults,
  fallbackProfile,
  type StoreName,
  type Track,
  type Settings,
  type Profile,
  type Playlist,
  type Run,
} from "../shared/model";
import { demoTracks } from "./demo";
const initial = {
  settings: defaults,
  library: { schemaVersion: 1, tracks: demoTracks },
  playlists: { schemaVersion: 1, playlists: [] },
  profile: fallbackProfile,
  runs: { schemaVersion: 1, runs: [] },
};
export async function readStore<T>(name: StoreName): Promise<T> {
  const raw = window.lanes
    ? await window.lanes.read(name)
    : JSON.parse(localStorage.getItem(`lanes.${name}`) || "null");
  const fallback = structuredClone(initial[name]);
  if (name === "settings" && !window.lanes && location.port !== "5173")
    (fallback as Settings).apiUrl = `${location.origin}/api`;
  return schemas[name].parse(raw ?? fallback) as T;
}
export async function writeStore(name: StoreName, value: unknown) {
  const parsed = schemas[name].parse(value);
  if (window.lanes) await window.lanes.write(name, parsed);
  else localStorage.setItem(`lanes.${name}`, JSON.stringify(parsed));
}
export async function loadState() {
  const [settings, library, playlists, profile, runs] = await Promise.all([
    readStore<Settings>("settings"),
    readStore<{ tracks: Track[] }>("library"),
    readStore<{ playlists: Playlist[] }>("playlists"),
    readStore<Profile>("profile"),
    readStore<{ runs: Run[] }>("runs"),
  ]);
  return {
    settings,
    tracks: library.tracks,
    playlists: playlists.playlists,
    profile,
    runs: runs.runs,
  };
}
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open("lanes.audio", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("files");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export async function saveAudio(id: string, bytes: ArrayBuffer) {
  if (window.lanes) return window.lanes.importAudio(id, bytes);
  const db = await database();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").put(new Blob([bytes]), id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
export async function getAudio(id: string) {
  if (window.lanes) {
    const response = await fetch(await window.lanes.audioUrl(id));
    if (!response.ok)
      throw Error("Audio file is unavailable. Reimport this track.");
    return response.arrayBuffer();
  }
  const db = await database();
  const blob = await new Promise<Blob>((resolve, reject) => {
    const r = db.transaction("files").objectStore("files").get(id);
    r.onsuccess = () =>
      r.result
        ? resolve(r.result)
        : reject(Error("Audio missing. Reimport this track."));
    r.onerror = () => reject(r.error);
  });
  db.close();
  return blob.arrayBuffer();
}
export async function hash(value: ArrayBuffer | string) {
  const bytes =
    typeof value === "string" ? new TextEncoder().encode(value) : value;
  return Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
  )
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
}
export async function api(
  apiUrl: string,
  path: string,
  method = "GET",
  body?: unknown,
): Promise<any> {
  if (!apiUrl)
    throw Error(
      "Connect a server in Settings to use online profiles and leaderboards.",
    );
  if (window.lanes) return window.lanes.api(path, method, body);
  const response = await fetch(`${apiUrl.replace(/\/$/, "")}${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok)
    throw Error(data.error || `Server returned ${response.status}`);
  return data;
}
export async function importMusic(
  file: File,
  onStage: (s: string) => void,
): Promise<Track> {
  if (file.size > 100 * 1024 * 1024)
    throw Error("Choose an audio file smaller than 100 MB.");
  onStage(`Decoding ${file.name}…`);
  const bytes = await file.arrayBuffer(),
    id = await hash(bytes),
    ctx = new AudioContext();
  let decoded: AudioBuffer;
  try {
    decoded = await ctx.decodeAudioData(bytes.slice(0));
  } finally {
    await ctx.close();
  }
  if (decoded.duration > 1800 || decoded.duration < 3)
    throw Error("Choose a track between 3 seconds and 30 minutes.");
  const sampleRate = Math.min(22050, decoded.sampleRate),
    ratio = decoded.sampleRate / sampleRate;
  const samples = new Float32Array(Math.floor(decoded.duration * sampleRate));
  for (let c = 0; c < decoded.numberOfChannels; c++) {
    const channel = decoded.getChannelData(c);
    for (let i = 0; i < samples.length; i++) {
      const start = Math.floor(i * ratio),
        end = Math.min(
          channel.length,
          Math.max(start + 1, Math.floor((i + 1) * ratio)),
        );
      let sum = 0;
      for (let j = start; j < end; j++) sum += channel[j];
      samples[i] += sum / (end - start) / decoded.numberOfChannels;
    }
  }
  onStage("Finding transients, rhythm, and four difficulty maps…");
  const result = await new Promise<any>((resolve, reject) => {
    const worker = new Worker(
      new URL("./analysis.worker.ts", import.meta.url),
      { type: "module" },
    );
    const timer = setTimeout(() => {
      worker.terminate();
      reject(Error("Analysis timed out. Try a shorter track."));
    }, 120000);
    const done = () => {
      clearTimeout(timer);
      worker.terminate();
    };
    worker.onmessage = (e) => {
      done();
      e.data.error ? reject(Error(e.data.error)) : resolve(e.data.result);
    };
    worker.onerror = () => {
      done();
      reject(Error("Audio analysis failed."));
    };
    worker.postMessage({ samples, sampleRate }, [samples.buffer]);
  });
  if (!result.charts.pro.notes.length)
    throw Error(
      "No clear musical transients were detected. Try another recording.",
    );
  await saveAudio(id, bytes);
  return {
    id,
    title: file.name.replace(/\.[^.]+$/, ""),
    artist: "Your import",
    duration: decoded.duration,
    bpm: result.bpm,
    favorite: false,
    art: 0,
    importedAt: new Date().toISOString(),
    charts: result.charts,
  };
}
