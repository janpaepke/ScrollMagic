# Roadmap

Ideas and future directions for ScrollMagic v3. Nothing here is committed, just a notepad for enhancements.

## Documentation & Demo Pages

API docs and interactive demos for v3. (Highest priority)

## Performance

### Shared rAF scheduler / eliminate extra frame latency

Currently a 2-frame pipeline: Container's `throttleRaf` fires in frame N, then ExecutionQueue schedules its own rAF for frame N+1. Container could flush instance queues directly in the same frame, consolidating N rAF registrations into 1.

### Cache ContainerProxy.rect

`ContainerProxy.rect` rebuilds the rect object on every access. Could cache and invalidate on resize/scroll.

### Hot-path allocation reduction

- `agnosticValues` allocates a new object on every call in the scroll/resize hot path — could mutate a reusable object instead.
- Bounds caches (`elementBoundsCache`, `containerBoundsCache`) use `Object.assign` — could mutate fields in place.
- Container event objects are created per dispatch — could reuse a single event object.

## Plugin Ideas

### Auto-refresh (MutationObserver + PositionObserver)

An opt-in plugin that automatically calls `refresh()` when layout-affecting changes are detected on the tracked element. Two complementary approaches:

- **MutationObserver** — watches `style` and `class` attribute changes on the element. Catches inline style modifications (`element.style.margin = '...'`) and class toggles. Limitation: high false-positive rate (fires on non-layout changes like `color`), can't detect stylesheet rule changes or media query transitions.
- **Userland PositionObserver** (e.g. [Shopify/position-observer](https://github.com/Shopify/position-observer)) — IntersectionObserver-based, detects actual position shifts without polling. Limitation: ~1px precision, only works while the element intersects the root.

Neither covers all cases, but together they could reduce the need for manual `refresh()` in common scenarios (framework re-renders, third-party widgets, CMS-injected content). Should be off by default due to overhead.

### Debug indicators

Visual debugging overlay similar to ScrollMagic v2's `addIndicators` plugin. Shows trigger positions, element start/end markers, and current progress. Helps developers see what ScrollMagic is calculating without console logging.

### Pin

Element pinning during scroll progress — the v2 `setPin` equivalent. CSS `position: sticky` covers the basic "pin while in viewport" case well, but doesn't handle unpin-and-repin scenarios (pin an element, release it at a specific scroll position, then re-pin it later). A plugin could fill that gap while recommending `sticky` for simple cases.

## Framework Integrations

### React

React wrapper/hooks for ScrollMagic. Reference implementation: [sm-test-react](https://github.com/janpaepke/sm-test-react). Should handle lifecycle cleanup (destroy on unmount), re-render-safe refs, and ideally provide a `useScrollMagic` hook.
