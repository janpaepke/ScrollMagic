# Maintaining ScrollMagic

Reference for triaging issues and PRs against **v3**.

---

## Philosophy

- **Actually read the issue** — every response should show it. No copy-paste walls.
- **Close fast over leaving open** — an open issue implies intent to act. If you won't act on it, close it clearly.
- **Specific > comprehensive** — 2–4 sentences that address the actual scenario beats a thorough generic answer.

---

## Issue Triage

### Categories

**Bug Reports** — broken behavior, browser-specific failures, wrong values, etc.

- Investigate. If confirmed, fix or document in `tests/e2e/UNTESTED-KNOWN-BUGS.md`.
- Label: `bug`

**Support / How-To** — "How do I...", "Is it possible to...", "Not working with X"

- Check comments first — if already answered, reference the solution: _"Looks like [username] provided a working solution above."_
- If you can answer confidently, do so briefly.
- Label: `support`

**Feature Requests** — new capabilities, API additions

- Evaluate fit with v3's scope and architecture.
- If in scope and a PR would be welcome, say so and label `help wanted`.
- Label: `enhancement`

**Build / Module Issues** — webpack, npm, TypeScript types, bundler problems

- v3 is a native ES module with TypeScript built-in — many v2-era build problems don't apply.
- Label: `support` or `bug` depending on whether something is broken vs. misunderstood.

**Meta / Admin** — license questions, dead links, repo housekeeping

- Handle case-by-case.
- Label: `invalid` or close without comment if clearly stale.

---

### Labels

| Label                | Meaning                                             |
| -------------------- | --------------------------------------------------- |
| `bug`                | Confirmed broken behavior                           |
| `enhancement`        | New capability request                              |
| `support`            | Usage question, how-to                              |
| `needs-info`         | Waiting on reporter to provide more context         |
| `needs-reproduction` | Cannot reproduce; a minimal repro is required       |
| `help wanted`        | Community contribution welcome                      |
| `good first issue`   | Low barrier, good entry point for new contributors  |
| `duplicate`          | Already tracked elsewhere — close and link          |
| `wontfix`            | Deliberate decision not to address                  |
| `invalid`            | Off-topic, spam, malformed                          |
| `mobile`             | Mobile-specific concern (IO, viewport, touch, etc.) |

---

### Response Guidelines

**Format:** No emojis in the body. 2–4 sentences specific to the issue, then close.

**Close reason:**

- Won't fix / out of scope: `not planned`
- Duplicate: `duplicate`
- Resolved or confirmed working: `completed`
- Spam / off-topic: `not planned`

### Response Templates

**Cannot reproduce:**

> Unable to reproduce this with the information provided. If you can share a minimal reproduction (CodePen, StackBlitz, or a small repo), that would help narrow it down significantly.

**Already answered in comments:**

> Looks like [username] provided a working solution above — hopefully that helps. Feel free to reopen with a reproduction if you're still running into this.

**Feature request, not accepting:**

> Thanks for the suggestion. This falls outside v3's current scope — [brief reason]. Feel free to open a discussion if you want to explore it further.

---

## Pull Requests

### Merge Criteria

- CI passes (types, lint, tests)
- New behavior has test coverage
- No unrelated changes bundled in
- Commit messages follow conventional commits

### Review Checklist

- Does the change match the stated intent?
- Is there a simpler approach?
- Are edge cases handled?
- Does it follow existing code style?

### Abandoned PRs

Comment asking for an update after 30 days of inactivity. Close after 60 days total — invite the author to reopen or for someone else to pick it up.

---

## Stale Issue Policy

1. Apply `needs-info` or `needs-reproduction` when waiting on the reporter.
2. If no response after 30 days, leave one comment asking for an update.
3. Close after 60 days total: _"Closing for inactivity — feel free to reopen or link a reproduction if you revisit this."_

<!-- GitHub Actions stale bot (https://github.com/actions/stale) can automate steps 2–3 if the volume warrants it -->

---

## Release Process

- Semver: patch for bug fixes, minor for new features, major for breaking changes
- Changelog maintained in `CHANGELOG.md`
- Tagged GitHub releases with release notes
- Published to npm as `scrollmagic`

---

## Handling v2 Issues

v2 is in maintenance-only mode — 2.0.9 is the final release. Issues filed against v2 should be acknowledged and redirected to v3.

### Approach by Category

**Bug:** Acknowledge the specific bug. Mention if v3's architecture approaches it differently (but don't promise a fix). Close as `not planned`.

**Support / How-To:** Answer briefly if confident — it helps people who find the issue via search. Then redirect to v3.

**Feature Request:** Note if v3 already covers it (see [v3 feature reference](#v3-feature-reference) below), or invite them to try v3 and reopen if still needed. Close as `not planned`.

**Build / Module:** Note that v3 is a native ES module with TypeScript built-in — most v2 bundler issues don't apply. Close as `not planned`.

When redirecting to v3, link to the [README on main](https://github.com/janpaepke/ScrollMagic/blob/main/README.md).

### v3 Feature Reference

Quick reference for assessing whether a v2 request or bug is addressed in v3:

- **No Controller** — each `new ScrollMagic({ element })` is self-contained
- **No pinning** — no pin system; CSS `position: sticky` covers most use cases
- **No built-in animation** — pair with GSAP, Motion, anime.js, etc.
- **Horizontal scroll** — `vertical: false` option
- **Any scroll container** — `scrollParent` accepts `window` or any element
- **Plugin system** — `addPlugin()` with `onAdd`, `onRemove`, `onModify` lifecycle hooks
- **Named position shorthands** — `'here'` (0%), `'center'` (50%), `'opposite'` (100%)
- **Inset functions** — `(size) => number` for dynamic computation
- **Native TypeScript** with full type exports
- **ES module** with UMD fallback, zero dependencies
- **SSR safe**
- **MIT license only** (v2 was dual MIT/GPL-3.0+)
- **Events:** `enter`, `leave`, `progress` — each with `direction`, `location`, `event.target`
- **Getters/setters** for all options; `modify()` for batch updates
