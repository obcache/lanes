# Handoff Guide

Run `npm run handoff -- "Concrete implementation and validation status"` before ending a long session. It updates tracked `docs/handoffs/HANDOFF.md` and creates an ignored timestamped snapshot. Read AGENTS.md, foundation, project gravity, engineering geometry, workflow, package scripts, manifest, planning, ledger, user guide, and that handoff on the next session.

Current source ownership: renderer under `src/`, isolated desktop code under `electron/`, PHP service/migration under `server/`, installer under `installer/`, build scripts under `tools/build/`. The package version stays 0.1.0 until a release/commit is requested. Real provider/MySQL setup and distribution signing require operator configuration; do not invent credentials or claim deployment.

Keep `docs/planning/To-do.md` active, record meaningful validation and rollback in `docs/dev-ledger.md`, and reconcile manifest paths, version targets, docs, and package scripts after architecture changes. Final reports include changed surfaces, tests, artifact rebuild, migration changes, and deployment actions.
