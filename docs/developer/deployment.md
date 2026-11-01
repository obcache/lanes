# Deployment Guide

## Runtime layout

The desktop app and PHP service are independent deployments. Build with `npm run api:dependencies`, `npm run package`, and `npm run package:installer`; run `npm run deploy:check` before delivery. No external host is configured or deployed by the build.

Ship `dist/installer/LANES-<version>-Setup.exe` or the complete `dist/LANES-win32-x64/` directory to Windows users. User data lives outside the installation; uninstalling the app should preserve it. Sign the executable/installer with the organization's certificate before public release if required by its distribution policy.

Upload the complete `dist/server/` tree to a private application directory and point Apache's DocumentRoot at **only** `dist/server/public/`. `src/`, `vendor/`, database scripts, and configuration examples must be outside the public root. PHP 8.2+, MySQL 8+ or MariaDB 10.6+, Apache mod_rewrite, and headers support are required. Enable `.htaccess` with the appropriate FileInfo/Options/Indexes overrides; `Options -Indexes` and `DirectoryIndex` must be permitted. The app expects its browser portal at `/` and API at `/api`; subdirectory hosting is not configured.

Enable PDO MySQL, curl, openssl, GD with PNG/JPEG/WebP support, mbstring, and fileinfo. Set request/body limits high enough for the bounded JSON artwork upload (API cap 16 MB; each image cap 5 MB) and PHP memory sufficient for a 4096×4096 image decode (256 MB recommended). HTTPS is required except for loopback development. Node is not needed on the PHP host.

## Database and private files

1. Create an empty LANES database using utf8mb4 and a dedicated application account.
2. Back up existing databases before any deployment. Apply `dist/server/database/migrations/001_initial.sql` **once**, using phpMyAdmin, a DBA tool, or a migration-capable shell. It creates users, hashed API tokens, one-use login tickets, charts, runs, and migration version 1. Application startup never migrates automatically.
3. Copy `server/config.example.php` to an absolute private path outside the document root and artifacts. Fill database connection values, canonical `base_url` (no trailing `/api`), identity-provider settings, and an external writable `storage_path`.
4. Set Apache's `LANES_CONFIG` environment variable to that private filename. PHP reads this variable directly; it does not automatically load `.env` files. Ensure PHP's process can read the config and write private storage and session files. Keep database passwords and OIDC secrets out of the renderer, repository, and `dist/`.
5. Restrict the runtime database user to the application tables. DDL privileges are only needed by the operator applying migrations.

Artwork is decoded and re-encoded to PNG, then stored by hash under the private `storage_path/assets/`. The API returns it only through authenticated profiles. It never serves original executable uploads. Files replaced by a profile are retained for operator cleanup/backup; no automatic garbage collector is included.

## Organization OIDC

Register a confidential web application with your identity provider. Its exact callback URI is `https://your-host/api/auth/callback`. Configure issuer, client ID, and client secret in the private PHP configuration. Use authorization-code flow with PKCE (the established Jumbojett library validates the provider response). The provider must include the configured array-valued group claim in the **ID token**. Group membership assigns `player` or `admin` at sign-in; all protected routes enforce a role on the server. There is no password bootstrap or username-based admin grant.

Map `player_group` and `admin_group` to explicit organization groups. An arbitrary signed-in subject without either group receives 403. Subjects use case-sensitive exact identity values. Admins inherit player operations; there is no separate administrative UI in this version. Database users and token/session lifetimes must be considered when revoking access: local API tokens expire after eight hours, and roles refresh on the next SSO sign-in. Revoke existing API tokens/sessions through the operator's process for immediate revocation.

The desktop opens system-browser sign-in and listens only on a random `127.0.0.1` port. The PHP callback returns a 90-second one-use ticket bound to the desktop's S256 challenge and state. Only a verifier exchange returns the eight-hour opaque API token. The desktop holds this token in main-process memory; it is never persisted in local JSON or exposed through the preload. Browser users use HttpOnly SameSite=Lax cookies, with origin validation on writes. Browser portal and API must share an origin; cross-origin browser hosting is not enabled.

## Verify activation

1. Confirm `/api/health` returns API version 1. This is a liveness check, not a database/auth readiness check.
2. Sign in with a group-authorized account on the browser portal; save/load both appearance assets.
3. Set the desktop Settings API URL to `https://your-host/api` and sign in from Profile.
4. Complete a practice track. Confirm the local result persists, the run syncs, profile server statistics increase, and the matching chart/difficulty board shows one best score.
5. Verify an unassigned identity is refused, a forged token is refused, and repeat score submission is idempotent.

Actual MySQL deployment and provider login are external acceptance steps. Automated API integration tests use a temporary SQLite fixture, not a production database or real IdP. Community scores remain unverified client claims despite consistency, checksum, ownership, and rate checks. Do not treat these boards as an anti-cheat system.

## Backup and rollback

Back up the MySQL database, private artwork storage, private configuration, and any session data required by the operator. Protect backups as credentials and user data. Restore into a separate test database/storage directory, verify users/assets/chart hashes/run totals and one best score per player, then switch configuration. Test restoration on the actual MySQL/MariaDB version before going live; only a fixture restore has been automated here.

To roll back app code, redeploy the previous complete `dist/server/` artifact and previous desktop installer. Keep runtime data separate. Migration 001 is additive initial schema; `database/rollback/001_initial.sql` is destructive and intended only for an unused failed initial deployment. For a live deployment, restore a verified pre-migration database backup instead. Do not drop shared tables as a routine code rollback.
