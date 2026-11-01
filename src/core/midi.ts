import { useEffect, useState, useSyncExternalStore } from "react";
let access: MIDIAccess | null = null;
let pending: Promise<MIDIAccess> | null = null;
let connectionError: unknown = null;
let revision = 0;
const listeners = new Set<(data: Uint8Array, device: string) => void>();
const changes = new Set<() => void>();
function changed() {
  for (const fn of changes) fn();
}
export function isMidiPermissionError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error.name === "NotAllowedError" || error.name === "SecurityError")
  );
}
const subscribe = (fn: () => void) => {
  changes.add(fn);
  return () => {
    changes.delete(fn);
  };
};
export function useMidiError() {
  return useSyncExternalStore(subscribe, () => connectionError);
}
export function useMidiConnected() {
  return useSyncExternalStore(subscribe, () => access !== null);
}
function attach() {
  if (!access) return;
  for (const input of access.inputs.values())
    input.onmidimessage = (e) => {
      if (e.data) for (const fn of listeners) fn(e.data, input.id);
    };
  changed();
}
export async function connectMidi() {
  const requestRevision = revision;
  try {
    const saved = window.lanes
      ? ((await window.lanes.read("settings")) as {
          midiAccessAllowed?: boolean;
        } | null)
      : null;
    if (saved?.midiAccessAllowed === false)
      throw new DOMException(
        "MIDI device access is turned off in LANES.",
        "NotAllowedError",
      );
    if (!navigator.requestMIDIAccess)
      throw Error(
        "MIDI is unavailable in this browser. Use the desktop app or Chrome.",
      );
    if (!pending) pending = navigator.requestMIDIAccess({ sysex: false });
    const connected = await pending;
    if (requestRevision !== revision) {
      for (const input of connected.inputs.values()) void input.close();
      throw Error("MIDI connection canceled.");
    }
    access = connected;
    connectionError = null;
    access.onstatechange = attach;
    attach();
    return access;
  } catch (error) {
    if (requestRevision === revision) {
      pending = null;
      connectionError = error;
      changed();
    }
    throw error;
  }
}
export function disconnectMidi() {
  revision++;
  pending = null;
  connectionError = null;
  if (access) {
    access.onstatechange = null;
    for (const input of access.inputs.values()) {
      input.onmidimessage = null;
      void input.close().catch(() => {});
    }
  }
  access = null;
  changed();
}
export function onMidi(fn: (data: Uint8Array, device: string) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
export function useMidiDevices() {
  const [, render] = useState(0);
  useEffect(() => {
    const fn = () => render((n) => n + 1);
    changes.add(fn);
    return () => {
      changes.delete(fn);
    };
  }, []);
  return access
    ? [...access.inputs.values()].map((i) => ({
        id: i.id,
        name: i.name || "MIDI input",
      }))
    : [];
}
