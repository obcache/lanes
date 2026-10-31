# Scope In This Project

Apply the operating principles below to the selected foundation. Reponator roadmap
items describe generator ambitions, not additional application features to build.

# Reponator Project Gravity And Ambition

## Purpose

Reponator exists to turn proven project operating patterns into repeatable generated defaults. Its goal is not merely to create starter repositories. Its goal is to install useful project gravity at creation time so future human and agent work naturally follows low-friction, high-signal paths.

The core belief is that successful projects tend to develop recurring structural patterns:

- a clear command surface
- a stable deployable artifact boundary
- durable planning and handoff documents
- explicit build, test, package, and deployment rituals
- a manifest of generated expectations
- enough local documentation that a new session can recover intent quickly

Reponator should encode those patterns so each new project begins with the same useful operating model, while still allowing stack-specific differences.

## Gravity Model

### Foundation Before Functionality

Every new project carries a `docs/PROJECT_FOUNDATION.md` and a machine-readable
`tools/project-mgmt/foundation.json`. The creation wizard records stack, target,
delivery, storage, user/access model, UX, branding and verification choices there.
Keep product functionality in the user's first implementation request. A foundation
choice describes the environment in which that functionality should be built.

The root `AGENTS.md` includes a short foundation summary and the core operating
principles directly, then requires reading the full foundation, this document,
`docs/developer/engineering-geometry.md`, the workflow guide, package manifest,
planning file and ledger before implementation. For agents that discover
`AGENTS.md`, those instructions are startup context. Linked files still need to
be read; a reference does not inject an entire document into an existing chat.

After the structure is finalized, reconcile package scripts, manifest paths,
version targets and all docs against the real code. Repeat after architectural
changes. Defaults are recorded decisions, not permission to ignore a later user
instruction or a changed deployment constraint.

### Relationships Guide Routine Decisions

Use cross-domain structural correspondence to choose reasonable implementations
without interrupting work for every missing detail. Preserve constraints,
interfaces, ownership and feedback relationships when translating a pattern.
Record the evidence, assumption, reversible choice and a validation check.
The companion engineering geometry guide supplies a practical procedure.

An analogy suggests a candidate design; it is not evidence that unrelated domains
are equivalent. Escalate only when a decision changes the requested outcome,
requires a real secret or provider choice, or has substantial irreversible cost.

### Useful Defaults Are Executable

Pair docs with discoverable scripts and validation. Unknown build/deploy commands
must fail with an actionable message until implemented. Local runtime data and
bootstrap secrets stay outside the shipped artifact and committed documentation.
Roles define permissions; groups organize membership; hybrid systems assign roles
through groups. Document and test the chosen authorization boundary explicitly.

In this project, "gravity" means the practical pull created by repo structure, scripts, naming, documentation, examples, and repeated workflow. It is the local language for attractors in both software projects and model behavior.

Useful project gravity bends future work toward intended outcomes:

- `package.json` becomes the familiar command surface.
- `dist/` becomes the deployable artifact boundary.
- `docs/planning/To-do.md` preserves current objective and next actions.
- `docs/dev-ledger.md` preserves why changes were made.
- handoff tooling snapshots state for continuity.
- deploy checks validate that generated artifacts match the target runtime.
- project manifests record expected files, paths, and assumptions.

The model is not a guarantee. Humans and models can still miss or ignore instructions when another context dominates. The point is to make the desired action the easiest, most visible, and most natural next move.

## Core Ambition

Reponator should become the automation layer for project setup patterns that have already proven useful across real projects.

The desired generated project should feel like this from the first commit:

```text
source is for building
dist is for shipping
package.json is the command surface
docs explain durable workflow rules
database migrations are explicit when present
deployment layout mirrors runtime layout
handoff and ledger preserve continuity
```

This should apply across different technologies without forcing every project into the same implementation stack.

## Core Gravity Invariants

Every generated project should include these defaults unless an archetype explicitly replaces them with a stronger equivalent:

- `package.json` exposes standard commands for build, test, package, handoff, versioning, and release.
- `dist/` is the only deployable or distributable artifact folder.
- source folders are never manually copied as deployment artifacts.
- generated docs distinguish public/user docs from developer/workflow docs.
- `docs/planning/To-do.md` records the current objective, next actions, backlog, risks, and done work.
- `docs/dev-ledger.md` records meaningful changes, rationale, validation, follow-ups, and rollback notes.
- `tools/project-mgmt/manifest.json` records generator version, project metadata, expected scaffold files, and archetype assumptions.
- build/package scripts should create a runtime-shaped artifact under `dist/`.
- deploy or release checks should validate artifact shape before upload or distribution.
- agent-facing instructions should require final reports to mention changed files, commands run, whether `dist/` was rebuilt, whether migrations changed, and whether deployment/upload is required.

## Archetype Gravity

Reponator should support project archetypes. Each archetype inherits core gravity and adds its runtime-specific artifact shape.

### PHP/MySQL/Apache Web App

Use for shared-hosting style applications.

Expected shape:

```text
dist/
  index.html
  assets/
  .htaccess
  api/
    index.php
    src/
    config.example.php
    database/migrations/
  uploads/
    .htaccess
```

Requirements:

- PHP and MySQL are production runtime technologies.
- Node/Vite/TypeScript may be build-time only.
- Apache `.htaccess` controls routing and file protection.
- API should use same-origin relative paths where possible.
- SQL migrations must be explicit and uploaded/applied intentionally.
- server shell access must not be assumed unless the project says so.

### Electron App

Use for desktop applications packaged from web/runtime sources.

Expected shape depends on packager, but `dist/` remains the distribution boundary:

```text
dist/
  win-unpacked/
  installer.exe
  latest.yml
```

Requirements:

- build scripts package the app into `dist/`.
- runtime assets are copied into the packaged app layout.
- signing, updater metadata, and installer outputs are explicit artifacts.
- source folders are not treated as distributable output.

### C++ App

Use for native applications while retaining `package.json` as the project command surface.

Expected shape:

```text
dist/
  app.exe
  runtime-assets/
  installer/
  checksums/
```

Requirements:

- `package.json` can wrap compiler/build-system commands.
- build output is normalized into `dist/` regardless of compiler-specific intermediate paths.
- installers, portable builds, symbols, and checksums should have predictable locations.
- generated docs should identify compiler/toolchain assumptions.

### Static Site

Use for static browser-only sites.

Expected shape:

```text
dist/
  index.html
  assets/
  .htaccess or host config when relevant
```

Requirements:

- `dist/` can be uploaded directly to the host document root or static host.
- no server runtime is implied.
- route fallback rules are generated when the site uses client routing.

### Generic Project

Use when no concrete runtime is known yet.

Requirements:

- still generate the core docs, ledger, handoff, versioning, and manifest.
- include placeholder build/package commands that fail with clear instructions rather than silently doing nothing.
- make the missing archetype decision visible in planning docs.

## Practical Requirements

Reponator itself is currently a VS Code extension built with TypeScript and Node tooling. It can rely on:

- VS Code extension APIs
- VS Code GitHub authentication
- GitHub REST for repository creation and authenticated Git for publishing
- local Git
- Node.js on the machine running the extension
- generated JavaScript tooling inside target projects

Generated projects should not assume the same runtime capabilities unless their archetype declares them. For example, a PHP shared-host project may use Node locally to build, but production cannot assume Node, Composer, shell access, Docker, or long-running workers.

## Challenges

### Precision Is Conditional

High-precision checks, such as matching local and remote commit SHAs, are useful signals but not absolute guarantees. They depend on file bytes, line endings, Git object behavior, author metadata, timestamps, filters, hooks, API behavior, and environment consistency.

Reponator should treat these checks as diagnostics:

```text
excellent signal when true
useful diagnostic when false
not the sole source of truth
```

The stronger invariant is that generated file paths, file hashes, remote existence, local repository state, origin configuration, branch setup, and working-tree cleanliness match expectations.

### Agents Can Miss Instructions

Generated docs and scripts should account for model behavior. Instructions are not enough by themselves. The repository should provide repeated structural cues:

- obvious script names
- predictable file paths
- deployable artifact boundaries
- short checklists in durable docs
- generated handoff summaries
- validation scripts that fail loudly

This increases the likelihood that future agents follow the intended workflow even in long or noisy contexts.

### Archetypes Must Avoid False Uniformity

The same operating philosophy should apply across PHP apps, Electron apps, C++ apps, static sites, and generic projects, but their runtime details differ. Reponator should not flatten these differences. It should separate:

- core invariants that apply everywhere
- archetype-specific build and deployment assumptions
- project-specific exceptions recorded in generated docs

### Placeholders Should Not Become Dead Weight

Starter docs should encode rules and decisions, not only blank sections. If a value is unknown, the generated project should make that unknown explicit and actionable.

Prefer:

```text
Build command is intentionally undefined until an archetype is selected.
Current objective: choose project archetype and artifact shape.
```

Avoid:

```text
Document build steps here.
```

## Near-Term Implementation Targets

1. Add archetype selection to project creation.
2. Generate archetype-specific `package.json` scripts.
3. Generate a `docs/developer/project-gravity.md` file in every new project.
4. Generate `tools/build/` scripts for package/deploy checks when the archetype needs them.
5. Add manifest fields for artifact boundary, runtime assumptions, build tools, deploy shape, and migration policy.
6. Add generated final-response expectations for agent-assisted work.
7. Treat local/remote commit SHA matching as a checkpoint with recovery guidance, not the only success condition.

## Success Criteria

Reponator is succeeding when a new project:

- starts with a coherent workflow instead of a blank process
- exposes standard commands through `package.json`
- creates or reserves `dist/` as the artifact boundary
- documents runtime and deployment assumptions up front
- has durable planning, ledger, and handoff surfaces
- can be understood by a fresh human or model session without reconstructing intent
- reduces friction without hiding project-specific decisions

