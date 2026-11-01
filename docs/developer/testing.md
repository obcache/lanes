# Testing Guide

## Automated checks

| Command | Coverage |
| --- | --- |
| `npm test` | Spectral analysis on synthetic pulses/silence; map density, lane constraints and determinism; hit selection, score arithmetic, calibration outliers, MIDI messages/channels; local JSON atomic writes/backups/corruption; patch/minor/major version sync in disposable copies; PHP domain validation |
| `npm run test:api` | Real local HTTP requests against isolated PHP + PDO SQLite fixture: authentication, profiles, both image types, executable image rejection, chart registration/checksums, counts/score validation, duplicate and ownership rules, aggregate stats, chart-specific best-score boards, one-use PKCE tickets, logout and backup/restore |
| `npm run test:smoke` | Browser library search/favorites, actual WAV import/worker analysis, playlist order, key/channel/offset persistence, real-time metronome taps, simultaneous appearance uploads, imported audio playback/keyboard hits/pause/result/retry, responsive layout, offline leaderboard, console health |
| `npm run test:desktop` | Packaged Windows executable startup, sandbox/preload, renderer Node isolation, rejected store traversal, real JSON persistence across restart, original practice playback/pause, CSP/console health |
| `npm run test:midi` | Browser denial notice → device-access help → correct settings-address copy → successful retry; mobile fit; packaged desktop saved denial → access checkbox → persisted allow → actual Chromium MIDI request succeeds with SysEx disabled |
| `npm run deploy:check` | Renderer/server/vendor/migration/executable/installer artifacts, configuration exclusions, synchronized first-party versions |
| `npm run scaffold:check` | Current manifest source paths and documented package commands |

For browser smoke tests, run `npm run dev` first. Playwright Chromium must be installed; `npx playwright install chromium` installs its browser if absent. Override `LANES_TEST_URL` for another preview URL. The development preview exposes a time-step hook and a concise `render_game_to_text` gameplay state; production omits the time-step hook.

`test:midi` also needs the dev server and a current `npm run package` output. It simulates denial/success in the browser and uses the actual native Web MIDI permission path in the packaged app, with temporary JSON settings. No OS privacy or browser preferences are changed. Native MIDI access succeeding without a controller verifies permission handling, not physical device input. Screenshots use the OS temporary directory (`lanes-midi-permission-*.png` and `lanes-midi-recovered-desktop.png`). Browser tooling is absent in this session; Playwright is the documented fallback.

Desktop tests require `npm run package` first and use a temporary `--user-data-dir`, never the real library. `LANES_TEST_EXECUTABLE` can select an installed test copy. They remove an inherited `ELECTRON_RUN_AS_NODE` environment value. Screenshots are written to the OS temporary directory, outside the repository. API tests require PHP curl, GD, and PDO SQLite DLLs; the npm script enables them only for the test process. Production does not use SQLite.

Visual verification uses the complete library concept in `docs/design/library-concept.png`, viewed alongside actual screenshots at 1586×992, plus a 390×844 browser viewport and the native app's default 1440×950 window. The Browser/IAB inventory was empty and its native pipe unavailable, so Playwright was the supported fallback. See `docs/design/verification.md` for comparison points, deviations, and evidence locations. The installed web-game client was also run against descending-note gameplay and its resulting screenshot/state inspected.

## Limits and release checks

No physical MIDI device, Bluetooth latency behavior, human musical-quality review, actual OIDC provider, Apache deployment, or production MySQL server was available to these tests. MIDI protocol handling and learning filters are tested in code; real-device round-trip calibration still needs manual QA. PHP integration seeds an isolated test identity/token and exercises the real ticket exchange; it does not claim to validate the external provider's authorization-code round trip.

Before release, perform `docs/manual-qa.md`, including installer install/start/uninstall and database backup/restore on the deployment runtime. Generated maps need listening/playtesting across genres and variable-tempo recordings. Tests of silence and periodic pulses establish boundaries, not chart quality for arbitrary music.
