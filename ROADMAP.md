# Roadmap

Ideas and future directions for ScrollMagic v3. Nothing here is committed, just a notepad for enhancements.

## Documentation & Demo Pages

API docs and interactive demos for v3. (Highest priority)

## API Gaps

### Core candidates

- **`signal` option for `on()`** — `on(type, cb, { signal: AbortSignal })` for lifecycle-bound bulk listener cleanup via `AbortController`. Matches DOM `addEventListener` pattern. Lower priority since `subscribe()` already returns an unsubscribe function.
- **Separate trigger element** — track one element's position but define the trigger range based on another element. Decouples "what to watch" from "when to activate." I don't think we want to implement this, since there might be a workaround using the pixelConverter function. If this turns out to be not true, we might consider a tuple as a valid value for element?

### Plugin candidates

- **toggleClass** — auto add/remove CSS class on enter/leave. The most common scroll use case — nearly every library has it. Usage-specific, so better as a bundled plugin than core API.
- **CSS variable output** — expose `--progress`, `--visible` etc. as CSS custom properties on elements. Enables pure-CSS scroll effects with zero JS callbacks.
- **Batch coordination** — when N elements enter the viewport in the same frame, fire one coordinated callback with stagger support. Essential for grid/list reveals.

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
