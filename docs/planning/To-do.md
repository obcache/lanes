# Project Plan and To-Do

## Current Objective

- [x] Build a playable Windows LANES application and deployable PHP/Apache/MySQL service implementing the requested local/online data split.
- [x] Recover from Web MIDI permission denial with a persistent notice, device-access settings control/help, and retry; fix the reproduced Electron permission-name mismatch.

## Next Actions

- [ ] Configure the operator's real organization OIDC issuer/client/group claims and MySQL/MariaDB database outside artifacts.
- [ ] Apply migration 001 on the intended server; validate Apache routing, browser/desktop login, artwork sync, automatic stats submission and exact-chart leaderboard population.
- [ ] Run manual physical-MIDI calibration and musical chart-quality checks across genres and variable tempo.
- [ ] Validate backup/restore on the actual MySQL/MariaDB deployment runtime.
- [ ] Choose a signing/distribution policy before public release; builds are currently unsigned.

## Acceptance Delivered Locally

- [x] Library import with real decode/onset analysis and four deterministic maps; no synthetic notes for silence.
- [x] Beginner lanes 1–3, Normal 1–4, Expert/Pro all five; Pro chords.
- [x] Audio-clock play, hit judgements, combo, score, pause/resume, results/retry and touch input.
- [x] Search/favorites and ordered local playlists with sequential play controls.
- [x] Unique keyboard and MIDI-note mapping, device/channel filtering and All default.
- [x] Audible metronome, descending calibration notes, adaptive estimate, early apply and automatic session-end save.
- [x] Local JSON settings/library/playlists/artwork/results with versioned import/export and managed local audio.
- [x] Profile image customization and authenticated PHP upload/download, with private storage and raster validation.
- [x] OIDC library integration, group-derived roles, main-process token handling and one-use PKCE login exchange.
- [x] Shared chart/run/stat schema, computed-score validation, idempotency, ownership and best-score boards.
- [x] Unit/domain, HTTP fixture, browser workflow and packaged desktop tests.
- [x] Real build/package scripts, Windows icons/installer, explicit migration/rollback and deployment docs.
- [x] Disposable Windows installer install, installed startup/persistence/playback, and uninstall smoke.
- [x] First-party version inventory; patch/minor/major synchronization tests exclude vendor/dependencies.
- [x] Reconcile package.json, manifest, foundation and all user/developer docs against implemented files and runtime assumptions.

## Backlog

- [ ] Improve generated charts with human playtest evidence; preserve existing maps and compatibility versions.
- [ ] Consider an authored-chart/editor workflow, richer note types, and a server-authoritative competitive mode if requested.
- [ ] Consider pending-run retry management and optional artwork retention cleanup if online operation requires them.

## Risks and Decisions

- Online deployment needs real credentials/provider/hosting; none were supplied or created. See `docs/developer/deployment.md`.
- Automatic transcription is heuristic and tempo estimates can be ambiguous. Generated map accuracy must be judged by listening/playtesting.
- Community scores are unverified client claims. Server consistency checks do not establish anti-cheat authority.
- Browser preview uses browser storage. The Windows app uses actual JSON files under userData; filesystem/device state never enters MySQL.
- Automated API integration uses a temporary SQLite fixture. Production uses MySQL/MariaDB; provider and database acceptance remain separate.
- See `docs/dev-ledger.md` for validation evidence and rollback notes.
