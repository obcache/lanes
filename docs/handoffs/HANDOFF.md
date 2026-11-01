# Project Handoff

Generated: 2026-10-31T18:16:26.891Z

## Summary

MIDI permission recovery completed: reproduced Electron midiSysex permission-name mismatch for sysex:false, fixed scoped handler, added persistent notice, local Device access checkbox and browser help/settings-address copy/retry. Unit, native/browser MIDI recovery, existing desktop and workflow smoke checks pass. App/server/installer dist rebuilt; no migrations or deployment. See newest ledger entry; physical controller QA and real online configuration remain external.

## Current Branch

main

## Working Tree

M .env.example
 M .gitignore
 M README.md
 M docs/PROJECT_FOUNDATION.md
 M docs/dev-ledger.md
 M docs/developer/build.md
 M docs/developer/deployment.md
 M docs/developer/handoff.md
 M docs/developer/testing.md
 M docs/developer/versioning.md
 M docs/manual-qa.md
 M docs/planning/To-do.md
 M docs/user/UserGuide.md
 M package.json
 M tools/project-mgmt/README.md
 M tools/project-mgmt/foundation.json
 M tools/project-mgmt/manifest.json
 M tools/project-mgmt/version-bump.js
 M tools/project-mgmt/version-show.js
 M tools/project-mgmt/version-sync.js
?? docs/design/
?? docs/developer/architecture.md
?? docs/handoffs/
?? electron/
?? index.html
?? installer/
?? package-lock.json
?? progress.md
?? public/
?? server/
?? src/
?? tests/
?? tools/build/
?? tools/project-mgmt/version-targets.js
?? tsconfig.electron.json
?? tsconfig.json
?? vite.config.mts

## Recent Commits

f93e560 chore: bootstrap project foundation

## Foundation

# lanes: Project Foundation

These selections were supplied through Reponator's creation wizard. They define
the implementation environment. The user's feature request supplies application
functionality. Scaffolding these decisions does not implement an application or login.

## Application and delivery

- stack: Electron / React / Vite / TypeScript
- platform: Windows desktop
- deployment: Desktop distribution
- packaging: Windows installer (Inno Setup)
- connectivity: Online service

## UX and branding

- theme: High contrast
- density: Touch-friendly
- layout: Task and form workflow
- primarySurface: Choose from application functionality
- overlays: Inline expand / collapse
- chrome: Custom themed titlebar and window controls
- scrollbars: Themed scrollbars and form controls
- tray: No tray integration
- branding: Create logo, app and launcher icons
- iconStates: Single application icon
- visualStyle: Expressive branded controls
- settings: Persist settings and workspace layout

## Storage and data exchange

- storage: MySQL / MariaDB behind a server API
- interchange: Versioned JSON import / export

## Users and access

- users: Multiple users, one organization
- authentication: OpenID Connect / organization SSO
- authorization: Groups assign roles
- adminSetup: Assign admin through the identity provider

## Verification

- testing: Unit + integration + key workflow smoke tests

## Administrator Bootstrap

- Initial admin username / identity: admin
- Credentials: No bootstrap password is stored.
- Application-managed passwords must be hashed and bootstrap enrollment disabled
  after first use. Require rotation of a supplied bootstrap password.
- External identity uses an allowlisted subject/group; do not grant admin to arbitrary SSO users.

## Delivery And Data Boundaries

Use package.json as the command surface and dist/ as the distribution boundary.
Keep mutable user data outside the installed application. Use migrations for
relational data, and test backup/restore. Shared databases live behind a trusted
server API; desktop/browser clients must not contain database credentials.
Electron implementations isolate the renderer from Node with a typed preload
bridge and validated IPC. Any settings, tray, icon and overlay decisions above
are foundation preferences; feature-specific behavior comes from the user request.

## Additional User Constraints

MIDI support will be needed

## Implemented Product and Ownership (2026-10-31)

LANES is a five-lane rhythm game with local audio import, four generated difficulty
maps (3/4/5/5 lanes), ordered playlists, keyboard/MIDI input, metronome calibration,
and profile artwork. The primary surface is the music library with a playable
lane preview; settings/profile workflows use inline sections and forms.

The shared MySQL/MariaDB storage selection applies to organization identities,
uploaded-profile asset references, submitted chart metadata, runs and statistics.
Library membership, playlists, calibration, MIDI/keyboard settings, workspace state,
and local media remain on the user's computer in versioned JSON and a managed media
folder. This local ownership is an explicit user requirement, not a database fallback.

The service is PHP 8.2+ on Apache with MySQL/MariaDB, using an established OIDC library
and group-derived roles. The desktop uses a sandboxed preload and validated IPC;
tokens stay in main-process memory. The browser profile portal is built from the
same React UI and uses localStorage/IndexedDB for browser-local preview data.

Build outputs are dist/renderer, dist/server (public/ is its only document root),
dist/LANES-win32-x64 and dist/installer. Local JSON, private server configuration,
uploaded image storage and credentials live outside installed/shipped artifacts.
No hosting, real IdP, production database or signing identity has been configured.
Community leaderboard consistency is enforced, but scores remain unverified.

## Implementation Handoff

1. Read AGENTS.md and the startup documents before designing application behavior.
2. Implement the user's functional request within this foundation.
3. Replace failing build/test/package placeholders with real stack commands.
4. Once the source layout is settled, review package.json, manifest.json, foundation,
   planning and all docs; reconcile paths, dependencies and runtime assumptions.
5. Adapt version-sync.js/version-show.js to the real stack-specific version files,
   excluding third-party modules and libraries. Test patch/minor/major behavior.
6. Record assumptions and validation; update the handoff before context is exhausted.

## Decision Sources

The original example separated Electron/React/Vite/TypeScript, local SQLite, dense
VS Code dark styling, collapsible panels, pinnable in-page previews, custom chrome,
tray lifecycle, logo/icons and state variants from product-specific monitoring rules.
This foundation generalizes those environmental decisions. It does not seed the
example application's features or its transcript.

Selection guidance: [Electron security](https://www.electronjs.org/docs/latest/tutorial/security/),
[SQLite deployment tradeoffs](https://www.sqlite.org/whentouse.html),
[OWASP authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).


## Planning Snapshot

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


## Dev Ledger Tail

(browser preview uses localStorage/IndexedDB). Only profile artwork and chart/run metadata are uploaded. Online service requires operator configuration; no real user credentials or production service were created.
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


## Next Session

Read AGENTS.md and its startup documents. Validate current state before editing.
