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
