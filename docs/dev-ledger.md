# Dev Ledger

This ledger is the development journal and changelog source for the project. Use it to preserve decisions, rationale, validation, rollback plans, and handoff context.

## Purpose

- Track meaningful development progress before and after commits.
- Preserve why a change was made, not only what changed.
- Keep rollback and follow-up tasks close to the work that created them.
- Provide source material for commit messages, release notes, and session handoffs.

## How To Use

- Add an entry for behavior changes, build changes, dependency updates, infrastructure work, or important investigations.
- Use `Status: Planned`, `Status: Draft`, or `Status: Complete`.
- Set entries to `Complete` when they should be considered ready for commit/release tooling.
- Include validation commands and rollback notes whenever practical.

## Entry Template

### [YYYY-MM-DD] Entry Title (Status: Planned)
Author: <name/initials>

Summary
- What changed and why.

Impact
- Areas/modules: <paths or systems>
- Risk: Low | Medium | High

Validation
- [ ] Command or manual check.

Follow-ups
- [ ] Remaining work.

Rollback Strategy
- How to revert or disable the change.

## Entries

### [2026-10-31] MIDI access notice, settings recovery and Electron permission fix (Status: Complete)
Author: Codex

Summary
- Reproduced the reported NotAllowedError in the actual packaged app. With requestMIDIAccess({sysex:false}), Electron 45.2.1 called the permission request handler with permission="midiSysex"; the existing "midi"-only policy rejected it. The observation required no physical controller and was captured before changing the policy.
- The trusted desktop permission helper now handles both MIDI names, checks the owning webContents, exact local app URL and main frame, and honors a local midiAccessAllowed preference. Other permissions and foreign/subframe requests remain denied. LANES still requests sysex:false; native recovery tests verify sysexEnabled=false.
- Added a persistent inline MIDI-access alert with Open device access settings and Try MIDI again. It appears for NotAllowedError and SecurityError, including automatic reconnect failures, rather than disappearing in a raw error toast.
- The button navigates to Settings and expands/focuses MIDI device access. Desktop users can change Allow LANES to access MIDI devices, saved in settings.json. Disabling closes active input ports and invalidates pending connections; older JSON defaults to the prior intended allowed policy without a schema-version bump.
- Browser users receive site-permission steps plus a copyable Chrome/Edge MIDI settings address. Browser pages cannot open protected settings URLs directly. No unrelated Windows privacy setting is presented as the cause, and no actual OS/browser preferences were changed by this work.
- Updated package commands, manifest source/command inventory, planning, user guide, architecture, testing and manual QA. The foundation's local settings ownership and inline expansion conventions are preserved.

Validation
- [x] npm test: 11 TypeScript tests including both MIDI permission types, exact-origin/frame/owner scope, disabled access and unrelated permissions; three release-version tests and PHP domain checks.
- [x] npm run test:midi: browser denial → persistent alert → settings help/copy → successful retry, 390x844 fit; real packaged Electron saved denial → checkbox → persisted allow → native MIDI success with SysEx disabled. Native denial was also asserted directly, not just simulated in the UI. No page/console errors.
- [x] npm run test:desktop and npm run test:smoke: existing packaged persistence/playback and complete import/playlist/calibration/artwork/game workflows passed.
- [x] npm run package and npm run package:installer rebuilt dist/renderer, dist/server, the Windows app and installer; npm run deploy:check and scaffold:check passed. Version remains 0.1.0; no commit/release bump was requested.
- [x] Playwright screenshots at 1440x950 and 390x844 inspected with view_image. Browser plugin is absent; regular Playwright was the documented fallback. Evidence: OS temp lanes-midi-alert-desktop.png, lanes-midi-permission-{desktop,browser,mobile}.png and lanes-midi-recovered-desktop.png.
- [x] Reviewed package.json, manifest, local settings compatibility and changed docs against actual files/behavior. git diff --check passed. No SQL migration or server configuration changes were needed; no hosting deployment performed.

Risks and rollback
- Physical MIDI controller input/latency remains a manual check. Successful native access with no attached controller establishes permission recovery, not device signal quality.
- Browser-managed or embedded-page permissions may require administrator intervention. The app provides guidance and retry without claiming it can override those policies.
- Revert the MIDI notice/permission/service changes together and rebuild artifacts. midiAccessAllowed is a backward-compatible optional-on-read preference in version-1 local JSON; no database rollback is needed.

### [2026-10-31] Playable LANES desktop and PHP service (Status: Complete)
Author: Codex

Summary
- Implemented the requested five-lane rhythm game from the empty Reponator scaffold: local music decode/onset analysis, four deterministic maps, 3/4/5/5 lanes, Pro chords, audio-clock play/scoring/pause/results, keyboard/MIDI mapping, metronome calibration, ordered playlists, artwork customization and versioned JSON import/export.
- Added a deployable PHP/Apache API and shared browser profile portal with established Jumbojett OIDC, ID-token group-derived roles, bounded one-use PKCE desktop ticket exchange, main-process-only API tokens, raster validation/re-encoding, chart registration, score/stat collection and exact-chart best-score boards.
- Preserved local ownership: filesystem/device/workspace state, audio, playlists and calibration stay under desktop userData JSON/media (browser preview uses localStorage/IndexedDB). Only profile artwork and chart/run metadata are uploaded. Online service requires operator configuration; no real user credentials or production service were created.
- Generated the complete working library concept and standalone aurora artwork with built-in ImageGen. Implemented dark/lime high-contrast UI, custom titlebar, themed forms/scrollbars, five-stripe SVG brand and PNG/ICO build variants. Design tokens, prompts and comparison/deviation record are under docs/design/.
- Replaced package placeholder commands with real build/test/package/deploy checks. Added Windows x64 distribution, Inno installer, explicit MySQL migration/rollback, PHP dependencies and all user/developer guides.

Decisions and evidence
- Preserved the audio clock as time authority; rendering and input are separate projections. Tests verify nearest-hit consumption, chords, score arithmetic and pause persistence. A two-second pre-roll makes imported opening notes playable.
- Generated maps follow detected transients rather than an imposed fixed BPM grid. Spectral flux and adaptive peak picking pass periodic-pulse/silence tests; BPM remains a summary estimate and human musical quality is still an acceptance task.
- Store writes serialize validated JSON, preserve .bak, and rename a temporary file. Corrupt data fails without replacement. Tests verify concurrent writes, backups, invalid data/store names and corruption preservation.
- API recomputes scores and partitions boards by chart hash, but an untrusted desktop can fabricate play. UI/docs label submissions unverified community scores; no anti-cheat claim is made.
- Group roles are assigned at the trusted server boundary. Subjects retain exact case-sensitive identity values. No app-managed password/admin bootstrap is used despite the scaffold's generic bootstrap guidance.
- Updated vulnerable build dependencies and bounded glob/minimatch overrides; package/installer/start tests establish compatibility. npm audit reports zero vulnerabilities for the resolved tree.

Fixes found during verification
- Rapid background and lane-texture selections could overwrite one another; partial profile updates now merge against current state.
- Leaderboard requests initially omitted chart hash; requests now select the exact registered chart version.
- Hidden mobile navigation labels lost their accessible names; route buttons now have explicit aria-labels.
- Bundled small font subsets were inlined as data URLs; desktop/Apache font CSP now permits local data fonts while remote fonts were removed.
- Resume UI state could race the asynchronous audio context; paused state now updates after successful resume.
- The broad scaffold build/ ignore also hid tools/build/; root artifact ignore patterns are now anchored so real build tools are tracked.

Impact
- Areas: src/, electron/, server/, installer/, public/, tests/, tools/build/, version tooling, package scripts/lockfiles and project docs.
- Risk: Medium. Real IdP/MySQL/Apache setup, physical MIDI latency and cross-genre chart quality remain external acceptance work. Installer/executable are unsigned.
- Migration: added server/database/migrations/001_initial.sql and a destructive fresh-deployment rollback script. No migration applied to any production database.

Validation
- [x] npm test: 8 TypeScript unit/integration tests, three disposable patch/minor/major version tests and PHP domain checks.
- [x] npm run test:api: isolated PHP HTTP/PDO SQLite tests for auth, profile artwork, chart checksum/lane validation, score arithmetic, idempotency/ownership, stats, best-score ranking, chart isolation, PKCE/replay/logout, and fixture backup/restore.
- [x] npm run test:smoke: actual WAV import/worker analysis, playlists, key/channel/offset persistence, real-time calibration, simultaneous artwork uploads/reload, timed keyboard scoring, pause/result/retry, mobile and offline board; no page/console errors.
- [x] npm run package and npm run test:desktop: packaged Windows startup, sandboxed preload, renderer Node isolation, rejected IPC traversal, settings JSON across restart, practice playback/pause and CSP/console health.
- [x] npm run package:installer: Inno Setup 6.7.0 compiled dist/installer/LANES-0.1.0-Setup.exe. A disposable install, installed executable restart/persistence/playback test and uninstall all returned success; application files were removed. Existing product registration was checked before the test.
- [x] npm run scaffold:check, npm run deploy:check and npm run version:show.
- [x] Native-size concept/browser view_image comparison at 1586x992; 390x844 responsive review and packaged 1440x950 screenshots. At least copy, layout, type, palette, media, icons and spacing checked; intentional differences documented.
- [x] Installed web-game Playwright client run against descending notes; screenshot/text state opened and inspected.
- [x] PHP syntax/domain checks, Composer configuration/locked dependency install and npm audit (zero findings).

Scaffold reconciliation
- Reviewed package commands/dependencies, manifest current layout/runtime assumptions, foundation local/shared ownership, explicit version targets and every startup/user/developer guide against actual source and artifacts.
- Version targets are root package/lock metadata, VERSION, server/composer.json and Inno MyAppVersion. Schema/API compatibility versions and vendor/dependency metadata are intentionally excluded. Patch/minor/major tests verify the complete target list without mutating the working release version (0.1.0).
- Historical manifest hashes remain creation-time evidence; implementation paths and executable checks describe current state. Runtime credentials/data are excluded from dist/. No commit, version bump, push or live deployment was requested.

Follow-ups
- [ ] Operator: configure real OIDC issuer/client/group claims, private LANES_CONFIG, Apache and MySQL; apply migration 001; perform browser/desktop live sign-in and data checks.
- [ ] Validate backup/restore on the actual MySQL/MariaDB runtime; the automated restore is an isolated SQLite fixture.
- [ ] Test real MIDI hardware and latency, representative codecs/genres, and intended signing/distribution policy.

Rollback Strategy
- Revert the application/tool/doc changes as a unit or redeploy the prior complete dist artifact. Keep local userData JSON/media and private server assets/configuration untouched.
- Restore a known-good .bak/export for local data. Multi-file imports are individually atomic, so a power loss during restore can require repeating the complete export import.
- No live database was changed. For an unused first deployment the rollback SQL removes the initial schema; for a live service restore a verified pre-migration database/asset backup rather than dropping tables.

### [2026-10-31] Initial Project Bootstrap (Status: Complete)
Author: reponator

Summary
- Created the initial project-management, documentation, handoff, and versioning scaffold.

Impact
- Areas/modules: docs, tools/project-mgmt, package.json
- Risk: Low

Validation
- [x] Run `npm run version:show`.
- [x] Run `npm run handoff`.

Follow-ups
- [x] Replace README outline text with project-specific content.
- [x] Add build, test, and deployment commands once the application stack is chosen.
- [x] After choosing the application stack, update version tooling for all real version locations.
- [x] Reconcile package.json, manifest.json, foundation and docs once the structure is finalized.

Rollback Strategy
- Revert the initial scaffold commit or remove generated workflow files.

## Changelog

Committed ledger entries can be moved here by project tooling.

## Rollback Task Template

### Rollback: <Title/ID>

Prereqs
- Current branch/commit: <ref>
- Backups/snapshots: <paths or links>

Steps
- [ ] Step 1.
- [ ] Step 2.

Verification
- [ ] Build/test pass: <commands>
- [ ] Manual checks: <list>

Restore Plan
- Outline how to recover if the rollback fails.
