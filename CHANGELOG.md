# Changelog

## 3.0.0-beta.1

### New Features

- **`scrollVelocity` getter** — per-container scroll velocity in px/s, shared across all instances on the same scroll parent via ContainerProxy. Returns 0 when disabled, destroyed, or idle (100ms staleness decay).
- **`enable()` / `disable()`** — temporarily disconnect all observers without destroying the instance. Progress freezes at its current value; `modify()`, `on()`/`off()`, plugins, and most getters remain functional. Re-enabling reconnects everything and schedules a full recalculation.
- **`{ once: true }` event listener option** — follows the DOM `addEventListener` options bag pattern. Works with both `.on()` and `.subscribe()`.
- **`refresh()` / `refreshAll()` / `destroyAll()`** — force bounds recalculation after layout changes invisible to ResizeObserver (position shifts, class toggles, sibling DOM mutations, font loading, etc.).
- **Post-destroy and non-browser guards** — all public methods now warn in dev mode and bail cleanly instead of producing undefined behavior when called after `destroy()` or outside a browser environment.
- **Element–scrollParent ancestry validation** (dev mode) — `console.error` when the tracked element isn't a descendant of its scroll parent, catching silent IntersectionObserver misconfiguration.

### Bug Fixes

- **Container position not initialized synchronously** — non-window containers defaulted to `{top:0,left:0}` until the first scroll/resize event, producing wrong initial progress for containers offset from the viewport top.
- **Zero-size container guard** — when a scroll container collapses to 0px, `updateProgress()` no longer produces incorrect values (division by near-zero) and `updateViewportObserver()` no longer passes broken margins to the IntersectionObserver.
- **Direction change not invalidating elementBoundsCache** — changing `vertical` via `modify()` left stale axis-dependent bounds in the cache.
- **containerBounds not rescheduled on option changes** — `triggerStart`, `triggerEnd`, and `vertical` changes via `modify()` didn't trigger a container bounds recalculation, causing wrong progress and viewport margins.
- **Stale closure in `onElementResize`** — `updateElementBoundsCache()` replaced the entire bounds object, but the resize handler's destructured reference pointed to the old one, so size comparisons always returned false and progress never recalculated after element resize.
- **`destroy()` skipping plugin `onRemove` callbacks** — plugin cleanup was routed through `removePlugin()`, which hit the `guardInert()` check (destroyed was already true) and silently skipped all `onRemove` callbacks.

### Performance

- **Replace debounce with `throttleRaf` for container resize** — removes the arbitrary 100ms debounce delay. Both window and element resize paths now use rAF-batched throttling for consistent, responsive behavior.
- **Cache PixelConverter results** — `elementStart`/`elementEnd` converters are skipped when element size is unchanged (common during scroll). Bounds caches mutated in-place via `Object.assign` instead of allocating new objects each frame.

### Internal

- Explicit `type` keyword on type-only imports for better tree-shaking.
- New `Vector` type for `{x, y}` pairs, replacing the old `ScrollDelta` shape.
- E2e tests reorganized from origin-based to feature-based structure. 13 regression tests covering v2-reported edge cases added.
- Added MAINTAINING.md and ROADMAP.md.
