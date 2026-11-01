# Architecture and data ownership

LANES has two delivery boundaries: a Windows Electron game and an independently hosted PHP/Apache service. They share versioned JSON contracts, not database credentials or filesystem access.

## Desktop

`src/App.tsx` composes navigation, state persistence and feature screens. `src/components/` owns library, playlists, gameplay, profile, settings, and leaderboard views. `src/core/analysis.ts` computes positive spectral flux with an FFT, locally adaptive peak picking, and weighted tempo votes. Import mixes/downsamples to mono 22.05 kHz and transfers samples to a worker. Difficulty generation thins onsets with minimum gaps, maps spectral bands/pattern order into 3/4/5/5 lane sets, and adds deterministic Pro chords. Analysis is bounded to 100 MB files / 30-minute tracks / a two-minute worker timeout. Decode still requires enough memory for the source audio.

Maps are immutable import results identified by audio SHA-256 and chart JSON SHA-256. All four maps use format version 1. Future analyzer changes must preserve existing maps and increment the generator/chart compatibility contract when needed. BPM is a summary estimate; notes follow detected transients rather than forcing every event onto a constant beat grid. Variable tempo and perceptual musical salience require human evaluation.

`Game.tsx` schedules audio against `AudioContext.currentTime`, with two seconds of pre-roll. Render frames draw the highway; they do not drive musical time. Input applies the saved offset before judgement. Pausing stops the source and resumes at its saved audio position. Hits are consumed once; chords have separate lane judgements. DOM HUD updates are throttled while per-frame state remains in refs. Canvas notes/lines and SVG icons are intentionally code-native functional geometry, while aurora/background media is generated art.

`electron/main.ts` owns a sandboxed BrowserWindow, validated IPC sender checks, narrow store/media/API commands, the secure app protocol, and main-process-only online tokens. The renderer has no Node access. Media access accepts only a SHA-256 ID within the managed media directory. The trusted main process alone calls the configured server. The service URL requires HTTPS except loopback. The main-process bridge uses the Electron security practices in the [official guide](https://www.electronjs.org/docs/latest/tutorial/security/). MIDI uses the [Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API) with sysex disabled, note-on/velocity/channel filtering, and selected device IDs.

## Ownership

Desktop MIDI permission handling accepts the Chromium `midi` and `midiSysex` permission names only for the owning `lanes://app` main frame and only when the local `midiAccessAllowed` preference permits access. Electron 45.2.1 was observed reporting `midiSysex` for a `requestMIDIAccess({sysex:false})` request; the old single-name allowlist caused `NotAllowedError`. LANES continues requesting standard MIDI with SysEx disabled; a real native test checks `sysexEnabled === false`. Other permissions and foreign/subframe requests remain denied. The renderer shows a persistent recovery notice and opens the relevant inline app control or browser-permission help. Browser pages cannot directly open protected `chrome://`/`edge://` settings URLs, so the browser flow offers address copy and site-specific steps.

| Data | Storage | Uploaded? |
| --- | --- | --- |
| Audio bytes | Desktop userData/media; browser IndexedDB in preview | Never |
| Library membership, favorites, playlists | Local versioned JSON | Never |
| Keybinds, MIDI selection, calibration, volume, speed, last screen/difficulty | Local settings.json | Never |
| Local artwork/display-name preview | Local profile.json | Only on Sync profile |
| Recent results (up to 2,000) | Local runs.json | Completed run attempts online sync when configured |
| Organization identity and group-derived role | Server MySQL | Through OIDC sign-in |
| Uploaded appearance assets | Private server filesystem; asset IDs in MySQL | Yes, profile-only |
| Public comparison chart metadata/map | Server MySQL charts | Registered with score submission; excludes library membership, paths and audio |
| Submitted runs and aggregate stats | Server MySQL | Yes, authenticated |
| Desktop API token | Main-process memory; hash/expiry in server MySQL | Never exposed to renderer or local JSON |

`electron/store.ts` validates schemas, serializes writes, writes a temporary file, preserves the previous `.bak`, then renames. Corrupt files fail closed without being replaced by defaults. An exported version-1 JSON backup covers local records, not audio blobs. Multi-file imports validate everything first, then write individual atomic stores; a power loss during a multi-file restore can require restoring the export again.

## PHP service

`server/public/api/index.php` routes bounded JSON requests to PDO and domain validation. `server/src/domain.php` enforces track/chart/lane/count/score invariants. `bootstrap.php` owns configuration, trusted authentication, JSON parsing, image decoding/re-encoding and private profile output. `auth.php` uses [Jumbojett OpenID Connect PHP](https://github.com/jumbojett/OpenID-Connect-PHP) for provider verification and authorization-code PKCE; roles come only from configured ID-token groups.

All routes except liveness and sign-in operations require an assigned player/admin role. Cookie writes require the canonical browser Origin. Desktop tokens are random opaque values stored only as hashes server-side, expire after eight hours, and can be revoked. One-use desktop tickets have an independent S256 verifier binding and 90-second expiry. API code never trusts a client-supplied user ID or role.

The server checks chart hashes against exact submitted JSON, validates lane/time bounds and duplicate notes, recomputes score and accuracy, limits per-user submission rate, enforces run ownership, and deduplicates retries. Boards partition by exact chart hash/difficulty/audio identity and choose one best result per player. These controls establish consistent records; they cannot prove a desktop client actually played the track. Scores remain explicitly unverified.

## Delivery

Source is not shipped. `tools/build/` and package scripts generate `dist/renderer`, `dist/server`, `dist/LANES-win32-x64`, and `dist/installer`. The server's only document root is its public subfolder. `LANES_CONFIG`, private image storage, local JSON, media, sessions, and database credentials stay outside immutable artifacts. MySQL migration 001 is applied by an operator; runtime startup never applies it implicitly.
