// Chromium can report midiSysex even for requestMIDIAccess({sysex:false}).
// Scope both permission names to the local app's main frame and saved consent.
export function allowMidiPermission(
  permission: string,
  accessAllowed: boolean,
  ownContents: boolean,
  requestingUrl: string,
  isMainFrame: boolean,
): boolean {
  if (
    !accessAllowed ||
    !ownContents ||
    !isMainFrame ||
    (permission !== "midi" && permission !== "midiSysex")
  )
    return false;
  try {
    const url = new URL(requestingUrl);
    return (
      url.protocol === "lanes:" &&
      url.host === "app" &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
