# Agent Instructions

This repository was initialized with Reponator. Before making changes, review the project-management scaffold so the work stays aligned with the project record.

## Foundation In Startup Context

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

Use these recorded choices when interpreting the user's functional request. Update
them when the user changes direction. The selection is a specification, not a claim
that an application, auth system or deployment has already been implemented.

## Engineering Defaults In Startup Context

- Preserve constraints, ownership, interfaces and invariants when applying patterns
  from another domain. An analogy suggests a design; tests and evidence establish fit.
- Make routine reversible decisions, record assumptions and validate them. Request
  missing facts for material outcome/cost/data-loss decisions or actual credentials.
- package.json is the command surface; dist/ is the shipped artifact boundary.
- Keep runtime data and secrets outside artifacts and committed docs.
- Use established domain/auth libraries; enforce authorization at trusted boundaries.
- When asked to commit, default to a patch bump unless major/minor was requested.

## Required Startup Read

Read these files at the start of a new coding session:

- `docs/PROJECT_FOUNDATION.md`
- `docs/developer/project-gravity.md`
- `docs/developer/engineering-geometry.md`
- `docs/developer/workflow.md`
- `README.md`
- `package.json`
- `tools/project-mgmt/manifest.json`
- `docs/planning/To-do.md`
- `docs/dev-ledger.md`
- Relevant files under `docs/developer/`
- `docs/user/UserGuide.md` when work affects user-facing behavior

## Working Practice

- Treat `docs/planning/To-do.md` as the active planning surface.
- Record meaningful decisions, validations, risks, and rollback notes in `docs/dev-ledger.md`.
- Update public-facing docs when behavior or workflows change.
- Use `npm run handoff` before ending long or complex sessions so future agents can resume from durable context.
- Use the package scripts as the default project-management entry points.
- Read `docs/handoffs/HANDOFF.md` when present.
- After finalizing the structure, review package.json, manifest.json, foundation and
  all docs against real files, commands and runtime assumptions. Record that review.
- Report changed files, validation, whether dist/ was rebuilt, migration changes
  and any deployment action still required.

## Versioning

The initial version tooling updates common locations only. After the lanes app stack and layout are finalized, inspect all first-party version locations and update `tools/project-mgmt/version-sync.js`, `version-show.js`, and related package scripts. Exclude third-party modules and libraries. Validate that patch, minor and major bumps synchronize the intended files.
