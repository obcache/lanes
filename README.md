# lanes

A five-lane rhythm game for Windows. Import your music, generate four difficulty maps, and play with a keyboard or MIDI controller. Electron, React, Vite, and TypeScript power the desktop app; a PHP/Apache API stores organization profiles, uploaded artwork, statistics, and community leaderboards in MySQL/MariaDB.

## Try it

Requires Node.js 22.12+ (24 LTS recommended), npm, and Windows x64.

```powershell
npm ci
npm run desktop
```

The original practice tracks work immediately. For the browser development preview run `npm run dev` and open http://127.0.0.1:5173. Desktop data lives in JSON under the Electron user-data directory (normally `%APPDATA%\LANES`); the browser preview uses localStorage and IndexedDB instead.

## Implemented

- Audio import with local spectral onset analysis, tempo estimation, and four deterministic, versioned charts.
- Beginner: lanes 1–3. Normal: lanes 1–4. Expert and Pro: all five. Pro adds chords.
- Audio-clock gameplay, hit judgements, scoring, combo, pause/resume, results, and touch input.
- Search, favorites, ordered playlists, and sequential playlist play using Next track.
- Keyboard remapping and MIDI note learning, input-device selection, and channels 1–16 or All (default).
- Metronome calibration with adaptive timing estimates and automatic saving after sufficient samples.
- Profile background and lane-texture uploads; images preview locally and can sync to the server.
- Versioned JSON backup/import. Audio, playlists, calibration, and device/workspace settings stay local.
- PHP API with organization OIDC login, group-derived roles, PKCE-bound desktop sign-in, image validation, chart registration, score/stat collection, and version-specific leaderboards.

Automatic charting estimates musically useful transients; it is not an authored-chart quality guarantee. Community scores are unverified client submissions, with server-side consistency checks. No anti-cheat authority or public hosting is implied.

## Build and verify

```powershell
npm test
npm run test:api
npm run api:dependencies
npm run package
npm run test:desktop
npm run package:installer
npm run deploy:check
```

With `npm run dev` running, `npm run test:smoke` exercises the complete browser workflow. API tests need PHP with PDO SQLite, curl, and GD; production uses MySQL. Inno Setup 6 is required for the installer (or set `ISCC_PATH`). All shipped artifacts are under `dist/`:

- `dist/LANES-win32-x64/LANES.exe` — launch with its adjacent runtime files.
- `dist/installer/LANES-<version>-Setup.exe` — unsigned Windows installer (filename follows package version).
- `dist/server/` — PHP application and browser profile portal; configure Apache's document root to its `public/` directory.

## Online setup

The app runs locally without credentials. To activate online features, deploy the server artifact, apply `server/database/migrations/001_initial.sql`, and configure your organization's OIDC provider. No real database, identity provider, signing certificate, or production host is configured in this repository. See [deployment](docs/developer/deployment.md) for exact setup, backup, and rollback instructions. Set the API URL in Settings, then sign in from Profile. Completed runs sync automatically when a server is configured; Sync score retries a failed submission.

## Documentation

- [User guide](docs/user/UserGuide.md)
- [Architecture and data ownership](docs/developer/architecture.md)
- [Build](docs/developer/build.md), [testing](docs/developer/testing.md), [manual QA](docs/manual-qa.md)
- [Plan](docs/planning/To-do.md), [ledger](docs/dev-ledger.md), [handoff](docs/handoffs/HANDOFF.md)
- [Version policy](docs/developer/versioning.md)

The project is private and unlicensed for public redistribution. Review first-party and dependency distribution terms and code signing before public release.
