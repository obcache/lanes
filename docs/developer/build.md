# Build Guide

Use Node.js 22.12+ (validated with 24.11.1), npm, and Windows x64. Dependencies are locked in `package-lock.json`. PHP 8.2+ is needed for API tests; Composer dependencies are locked under `server/`. Production extensions: PDO MySQL, curl, openssl, GD, mbstring, fileinfo, and JSON. SQLite is used only for isolated tests.

```powershell
npm ci
npm run api:dependencies
npm run build
npm run package
npm run package:installer
npm run deploy:check
```

`api:dependencies` downloads the official Composer installer, checks its published SHA-384, and installs locked dependencies with PHP extensions enabled for that invocation. It never changes the machine's php.ini. If PHP already loads these extensions, use the normal `composer install --no-dev --working-dir=server` command to avoid duplicate-extension notices. No Composer CLI is needed on the production host because vendor files are built locally into `dist/server/`.

`build` runs both TypeScript checks, builds the Vite renderer under `dist/renderer/`, bundles Electron main/preload code under `build/electron/`, creates PNG/ICO icons from `public/icon.svg`, and copies a clean PHP artifact to `dist/server/`. Fonts and aurora artwork are local assets. The build never copies live configuration, local media, user JSON, or repository docs into the server artifact. `build/` is intermediate, not distributable.

`package` stages only the renderer and bundled Electron code, then produces `dist/LANES-win32-x64/` with `@electron/packager`. Native Node integration is disabled in the renderer; the app uses the `lanes://app` protocol and a sandboxed preload. The launcher removes an inherited `ELECTRON_RUN_AS_NODE` variable so `npm run desktop` works inside developer tools as well as ordinary shells.

`package:installer` compiles `installer/lanes.iss` with Inno Setup 6. It checks `ISCC_PATH` and the standard installation directories. The generated per-user installer is under `dist/installer/`. Builds are unsigned; no signing credentials are supplied. Compiler licensing must permit the intended distribution.

Development commands:

- `npm run dev`: renderer preview at http://127.0.0.1:5173.
- `npm run desktop`: rebuild and launch the real Electron app.
- `npm run api:dev`: PHP built-in server at http://127.0.0.1:8080 serving the built browser portal/API; build first and set `LANES_CONFIG`.
- `npm run format`: format TypeScript, CSS, tests, and build/version tools.

`dist/` is the artifact boundary. Ship the complete Windows app directory, its installer, or the complete server artifact as appropriate. Never copy application source as a substitute. See [deployment](deployment.md) and [testing](testing.md).
