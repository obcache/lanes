# Versioning Guide

## Policy

The root `package.json` version is the source of truth. Version tooling also updates package-lock files, nested package files, `VERSION`, `version.txt`, and common Inno Setup version fields when those files exist.

After the application stack is chosen, inspect the codebase for stack-specific version locations and update `tools/project-mgmt/version-sync.js`, `version-show.js`, and package scripts accordingly. Examples include installer definitions, desktop app metadata, browser extension manifests, mobile app manifests, Docker labels, generated web assets, and per-package workspace versions.

## Commands

```powershell
npm run version:show
npm run version:bump:patch
npm run version:bump:minor
npm run version:bump:major
```

## Commit Convention

Freeform requests to "commit" should be treated as a patch release unless the requester explicitly asks for a minor or major release.

```powershell
npm run commit -- "message"
npm run commit:minor -- "message"
npm run commit:major -- "message"
```
