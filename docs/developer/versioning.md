# Versioning Guide

`package.json` is the application version source. The explicit targets in `tools/project-mgmt/version-targets.js` are root package metadata, root lockfile and its package entry, `VERSION`, `server/composer.json`, and the Inno `MyAppVersion` define. The installer filename and Electron package metadata derive from this value when rebuilt. Vite assets use content hashes. The API format version and local JSON/chart schema versions are independent compatibility numbers and do not change with every release.

`version-sync.js` touches only those first-party targets. It excludes dependencies, vendor, generated artifacts, runtime JSON, and all other nested package manifests. `version-show.js` fails on a mismatch. The Composer lock records dependencies, not the root app version; validate it after changing Composer requirements.

```powershell
npm run version:show
npm run version:sync
npm run version:bump:patch
npm run version:bump:minor
npm run version:bump:major
```

Tests run patch/minor/major bumps in disposable directories, check all intended values including Inno and lockfile root metadata, and ensure vendor/dependency versions stay unchanged. Rebuild/package after any bump; existing `dist/` artifacts retain their compiled versions.

User requests to commit default to a patch release. `npm run commit -- "message"` uses the scaffold's release workflow, which can push if a remote exists. No commit, bump, or push is implied by ordinary implementation work. This implementation retains version 0.1.0.
