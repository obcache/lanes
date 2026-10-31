# Engineering Geometry: Relationships As A Decision Map

## Purpose

Use the shape of relationships across engineering domains to make bounded,
testable decisions when a specification leaves routine details open. This guide
adapts structural ideas from a supplied reference into software practice. Apply it
through explicit constraints, observations and validated engineering decisions.

## Preserve Structure Before Vocabulary

A graph can describe UI navigation, dependency flow, data ownership or deployment.
A boundary can describe a process, API, permission scope or transaction. An overlap
can indicate an integration interface rather than another component. Correspondence
is useful when relationships match, even when labels and technologies differ.

| Shape | Engineering use | Check before applying |
| --- | --- | --- |
| Nodes and edges | Modules, dependencies, routes, ownership | Which dependencies are directional? Which cycles are allowed? |
| Layers and projections | UI, domain, persistence, packaging views | Does each view preserve the same contracts and source of truth? |
| Boundaries and thresholds | IPC, trust boundary, migration, release gate | Validate input, permissions, failures and rollback at the crossing. |
| Overlap / intersection | Adapter between two subsystems | Is this an interface rather than shared mutable ownership? |
| Feedback loop | Validation, retry, monitoring, user confirmation | What stabilizes the loop? Bound retries and avoid oscillation. |
| Attractor / shortest path | Repo defaults, scripts, folder layout | Does the easiest action produce the intended result? |
| Conservation / invariants | Version, identity, data integrity, audit trail | What must survive a transformation or deployment unchanged? |
| Reconstruction | Handoff, ledger, decision record, docs | Can another session recover rationale and next steps from these artifacts? |

## Practical Decision Procedure

1. State the goal and the constraints already established by the user, foundation,
   existing code and deployment target.
2. Identify the relationship that matters: ownership, direction, boundary, cycle,
   resource limit or state transition. Separate observations from assumptions.
3. Find a familiar pattern with the same relationship. Explain the correspondence
   in plain language, including the point where it stops applying.
4. Choose the smallest reversible implementation that preserves the invariants.
   Use established libraries and local conventions when they cover the domain.
5. Validate with a test, probe or visible workflow. Reject or revise the analogy
   when observed behavior contradicts it.
6. Record the assumption, decision, evidence, validation and rollback in the ledger.
   Add unresolved material issues to the planning file.

## Examples

- A pinnable popover and a desktop utility window both need ownership, focus and
  dismissal rules. Preserve those rules inside the page; the analogy does not
  justify spawning an operating-system window when the foundation selects overlays.
- A database migration and a deployment are both threshold crossings: validate
  prerequisites, apply deliberately, check the new state and provide a recovery path.
- A build artifact and a database backup both need reproducibility and integrity.
  Their ownership differs: ship immutable artifacts from dist/; protect mutable
  production data outside the artifact and preserve its access controls.
- An authorization graph can model users, groups, roles and permissions. A group
  edge is not itself a permission unless the policy says so. Enforce and test each
  protected action at the server or trusted process boundary.
- A new local Git repo and its GitHub remote share an identity only after origin,
  branch tracking and actual published commits are verified. A matching folder
  name or an editor window title does not establish that relationship.

## Continue Work With Explicit Assumptions

Proceed on routine, reversible choices consistent with the recorded foundation.
When an ambiguity affects outcome, a trust boundary, data loss, cost or provider
authority, gather evidence or request the missing fact. A geometric resemblance
cannot manufacture credentials, product requirements or user consent.

## Failure Modes

- Forcing a literal one-to-one mapping across unrelated domains.
- Using an elegant diagram as proof that a system is correct.
- Preserving terminology while losing ownership or failure behavior.
- Treating defaults as permanent requirements after the user changes direction.
- Making documentation heavier than the work it supports.
- Describing a component as complete without validating its boundaries.

Keep reasoning concise and accountable: constraint -> relationship -> choice ->
test -> durable record. The map supports the work; evidence decides whether it fits.
