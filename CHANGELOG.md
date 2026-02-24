# Changelog

## Unreleased

#### New Features

- **`{ signal: AbortSignal }` event listener option** — follows the DOM `addEventListener` pattern. Pass an `AbortController`'s signal to `on()` or `subscribe()` to remove one or many listeners with a single `abort()` call.

### 3.0.0-beta.4

#### Internal

- Codebase terminology cleanup (remove legacy "scene" naming, rename `scrollOffset` → `activeRange`).
- ContainerProxy: separate `size`/`position` getters replace combined `rect`.
- Unit test coverage expanded from 84 to 164 tests.

### 3.0.0-beta.3

#### Breaking Changes

- **Options renamed** — `scrollParent` → `container`, `triggerStart` → `containerStart`, `triggerEnd` → `containerEnd`. This groups container-related options under a shared prefix and avoids confusion with GSAP's `trigger` (which refers to the element, not the container). The `resolvedBounds` getter now returns `{ element, container }` instead of `{ element, scrollParent }`.

#### New Features

- **Multi-match selector warning** (dev mode) — when a CSS selector passed to `element` or `container` matches more than one DOM element, a warning advises creating one instance per element instead.

#### Build

- **Original sources embedded in source maps** — published `.map` files now contain the actual TypeScript source via `inlineSources`, making them useful for debugging without the `src/` directory.

### 3.0.0-beta.2

#### Breaking Changes

- **`destroy()` calls `onDestroy` instead of `onRemove` on plugins** — `onRemove` now only fires via `removePlugin()`. Plugins that used `onRemove` for destroy cleanup should add `onDestroy` (or assign the same function to both).
- **`computedOptions` removed** — replaced by `resolvedBounds`, which returns `{ element: ElementBounds, container: ContainerBounds }` (cached layout bounds only, no longer leaks the full internal options structure).
- **Getter return types narrowed** — `element`, `container`, and `vertical` getters now return resolved types (`Element`, `Window | Element`, `boolean`) instead of the raw public input union. Setters still accept the full public types.

#### New Features

- **Plugin lifecycle hooks: `onEnable`, `onDisable`, `onDestroy`** — plugins can react to enable/disable transitions and distinguish manual removal from instance teardown. `destroy()` on an enabled instance fires `onDisable` → `onDestroy` in sequence.
- **`scrollmagic/util` subpath export** — exposes `agnosticValues` and `agnosticProps` via `import { ... } from 'scrollmagic/util'` for plugin authors working with direction-agnostic bounds.
- **`ElementBounds`, `ContainerBounds`, `ResolvedBounds` types exported** — available from the main entry point for plugin and integration authors.

## 3.0.0-beta.1

### New Features

- **`scrollVelocity` getter** — per-container scroll velocity in px/s, shared across all instances on the same container via ContainerProxy. Returns 0 when disabled, destroyed, or idle (100ms staleness decay).
- **`enable()` / `disable()`** — temporarily disconnect all observers without destroying the instance. Progress freezes at its current value; `modify()`, `on()`/`off()`, plugins, and most getters remain functional. Re-enabling reconnects everything and schedules a full recalculation.
- **`{ once: true }` event listener option** — follows the DOM `addEventListener` options bag pattern. Works with both `.on()` and `.subscribe()`.
- **`refresh()` / `refreshAll()` / `destroyAll()`** — force bounds recalculation after layout changes invisible to ResizeObserver (position shifts, class toggles, sibling DOM mutations, font loading, etc.).
- **Post-destroy and non-browser guards** — all public methods now warn in dev mode and bail cleanly instead of producing undefined behavior when called after `destroy()` or outside a browser environment.
- **Element–container ancestry validation** (dev mode) — `console.error` when the tracked element isn't a descendant of its container, catching silent IntersectionObserver misconfiguration.

### Bug Fixes

- **Container position not initialized synchronously** — non-window containers defaulted to `{top:0,left:0}` until the first scroll/resize event, producing wrong initial progress for containers offset from the viewport top.
- **Zero-size container guard** — when a scroll container collapses to 0px, `updateProgress()` no longer produces incorrect values (division by near-zero) and `updateViewportObserver()` no longer passes broken margins to the IntersectionObserver.
- **Direction change not invalidating elementBoundsCache** — changing `vertical` via `modify()` left stale axis-dependent bounds in the cache.
- **containerBounds not rescheduled on option changes** — `containerStart`, `containerEnd`, and `vertical` changes via `modify()` didn't trigger a container bounds recalculation, causing wrong progress and viewport margins.
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
