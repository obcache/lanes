# Development And Operations Workflow

## Start A Session

Read root AGENTS.md, docs/PROJECT_FOUNDATION.md, package.json,
tools/project-mgmt/manifest.json, the planning file and recent ledger entries.
Read project gravity and engineering geometry before making architectural choices.
Resume from docs/handoffs/HANDOFF.md when present.

## Establish The Application

Translate the foundation into the real stack and source layout. Preserve project
management commands when adding application scripts and dependencies. Implement
build, test, package and deployment checks using the chosen toolchain. Until then,
placeholder commands must fail and identify the work required.

Use dist/ as the distribution boundary, with runtime assets in the locations the
packaged program expects. Data, logs, user settings and credentials are not build
artifacts. Make database migrations explicit and test backup/restore when relevant.

## Reconcile After Structure Is Finalized

- Review package.json commands and dependencies against real source and runtime.
- Update the manifest and foundation if any files, assumptions or decisions changed.
- Adapt version-sync.js and version-show.js to all first-party version locations:
  installer definitions, application manifests, native metadata and workspace packages.
- Leave dependency/library versions and vendored code untouched by project bumps.
- Verify a patch bump in a disposable copy, including lockfile root metadata.
- Update README, build/deployment/testing guides and user documentation.
- Record the review and validation in the ledger; close the planning task.

## Validate And Release

Run focused checks while editing and the selected release checks before delivery.
Test a built artifact, including install/start/uninstall and native assets when
applicable. Freeform requests to commit imply a patch bump; explicit major/minor
requests override that default. Use the package commit scripts after verification.
Do not publish to an external service unless the user has requested that action.

## Preserve Continuity

Keep planning tasks small and ledger entries explicit about decisions, evidence,
risks and rollback. Run npm run handoff before a long session ends. Final reports
state changed files, checks, artifact rebuild status, migration changes and any
deployment action still needed. These records must permit a new session to resume
without a full conversation transcript.

## Initial Administrator

Reponator records an account policy; it does not implement the application's login.
Build first-run enrollment or an environment-driven bootstrap flow using an
established authentication library. A supplied/generated password is local-only
in ignored .env.local as ADMIN_BOOTSTRAP_PASSWORD_B64 (UTF-8 encoded as base64).
Decode once for enrollment, hash using the selected auth library, require rotation
on first sign-in, disable the bootstrap path after enrollment, and remove the local
bootstrap secret when consumed. Base64 is an encoding, not encryption. Never copy
it into docs, source, assets, client bundles or production defaults. SSO admin
assignment uses an explicit identity-provider subject/group allowlist.
