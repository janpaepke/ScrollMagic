# ScrollMagic 3

![npm version](https://img.shields.io/npm/v/scrollmagic/next)
![license](https://img.shields.io/npm/l/scrollmagic)
![bundle size](https://img.shields.io/badge/gzip-~6kb-brightgreen) <!-- TODO: replace with bundlephobia badge once stable release is published -->
![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-native-blue)

### The lightweight library for magical scroll interactions

> **Looking for ScrollMagic v2?** The legacy version is on the [`v2-stable`](https://github.com/janpaepke/ScrollMagic/tree/v2-stable) branch.

ScrollMagic tells you where an element is relative to the viewport as the user scrolls — and fires events when that changes.

It's a convenience wrapper around [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver) and [ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) that handles the performance pitfalls and counter-intuitive edge cases for you.

[![Donate](https://scrollmagic.io/assets/img/btn_donate.svg 'Shut up and take my money!')](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=8BJC8B58XHKLL 'Shut up and take my money!')

### Not an animation library – unless you want it to be

By itself, ScrollMagic doesn't animate anything. It provides precise scroll-position data and events — what you do with them is up to you. If you're looking for a ready-made scroll animation solution, check out [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/), [Motion](https://motion.dev/docs/scroll), or [anime.js](https://animejs.com/).

ScrollMagic is the foundation, tools like these can be built upon: framework-agnostic, zero-dependency, and usable for any scroll-related UX — class toggles, progress-driven animations, lazy loading, parallax, scroll-linked video, behavioural tracking, or anything else.

### Why ScrollMagic?

- Tiny footprint, zero dependencies
- Free to use ([open source](LICENSE.md))
- Optimized for performance (shared observers, batched rAF, single-frame updates)
- Built for modern browsers, mobile compatible
- Native TypeScript support
- SSR safe
- Works with any scroll container (window or custom element)
- Horizontal and vertical scrolling
- Plugin system for extensibility
- Framework agnostic — works with React, Vue, vanilla JS, anything

## Installation

```sh
npm install scrollmagic@next
```

## Quick Start

```js
import ScrollMagic from 'scrollmagic';

new ScrollMagic({ element: '#my-element' })
	.on('enter', () => console.log('visible!'))
	.on('leave', () => console.log('gone!'))
	.on('progress', e => console.log(`${(e.target.progress * 100).toFixed(0)}%`));
```

## How It Works

ScrollMagic uses two sets of bounds to define when a scene is active:

- **Trigger bounds** — a zone on the scroll container, defined by `triggerStart` and `triggerEnd`
- **Element bounds** — a zone on the tracked element, defined by `elementStart` and `elementEnd`

Progress goes from `0` to `1` as the element bounds pass through the trigger bounds. Events fire on enter, leave, and progress change.

<!-- TODO: add diagram illustrating trigger bounds and element bounds -->

## Options

All options are optional. They can be passed to the constructor and updated at any time via setters or `.modify()`.

| Option         | Type                                   | Default                       | Description                                           |
| -------------- | -------------------------------------- | ----------------------------- | ----------------------------------------------------- |
| `element`      | `Element \| string \| null`            | first child of `scrollParent` | The tracked element (or CSS selector).                |
| `scrollParent` | `Window \| Element \| string \| null`  | `window`                      | The scroll container.                                 |
| `vertical`     | `boolean`                              | `true`                        | Scroll axis. `true` = vertical, `false` = horizontal. |
| `triggerStart` | `number \| string \| function \| null` | inferred (see below)          | Start inset on the scroll container.                  |
| `triggerEnd`   | `number \| string \| function \| null` | inferred (see below)          | End inset on the scroll container.                    |
| `elementStart` | `number \| string \| function`         | `0`                           | Start inset on the element.                           |
| `elementEnd`   | `number \| string \| function`         | `0`                           | End inset on the element.                             |

**Inset values** work like CSS `top`/`bottom`: positive values offset inward from the respective edge. Accepted value types:

- **Numbers** — pixel values (e.g. `50`)
- **Strings** — percentage or pixel strings (e.g. `'50%'`, `'20px'`), relative to the parent size (scroll container for trigger options, element for element options)
- **Named positions** — `'here'` (0%), `'center'` (50%), `'opposite'` (100%)
- **Functions** — `(size) => number` for dynamic computation

**`null` means infer:** For `element`, `scrollParent`, `triggerStart`, or `triggerEnd`, setting it to `null` resets them to their inferred default.

For `triggerStart`/`triggerEnd` the inferred values depend on the `element` option value:

- **`element` is `null`** → the element defaults to the first child of the scroll container (for `window` this is `document.body`), which is expected to define the full scrollable height. Triggers default to `'here'` (0%), so progress maps to the overall scroll position within the container, going from 0 at the top to 1 at the bottom.
- **`element` is not `null`** → triggers default to `'opposite'` (100%), making the entire scroll container the trigger zone. Progress goes from 0 to 1 as the element scrolls through the container — entering from one edge and leaving through the other.

## Events

Subscribe with `.on()`, `.off()`, or `.subscribe()` (returns an unsubscribe function).

| Event      | When                                                     |
| ---------- | -------------------------------------------------------- |
| `enter`    | Element enters the active zone (progress leaves 0 or 1)  |
| `leave`    | Element leaves the active zone (progress reaches 0 or 1) |
| `progress` | Progress value changes while in the active zone          |

Every event provides:

```ts
event.target; // the ScrollMagic instance (access all properties, e.g. event.target.progress, event.target.element)
event.type; // 'enter' | 'leave' | 'progress'
event.direction; // 'forward' | 'reverse'
event.location; // 'start' | 'inside' | 'end'
```

## Examples

```js
// Default: active from the moment any part of the element
// enters the viewport until it fully leaves it
new ScrollMagic({
	element: '#a',
});

// Active while the element passes through the center line
new ScrollMagic({
	element: '#b',
	triggerStart: 'center',
	triggerEnd: 'center',
});

// Same as above, but with element offsets:
// starts 50px before the element, ends 100px after it
new ScrollMagic({
	element: '#c',
	triggerStart: 'center',
	triggerEnd: 'center',
	elementStart: -50,
	elementEnd: -100,
});

// Active while passing center, but with a fixed scroll
// distance of 150px, regardless of element height.
// elementEnd receives the element's size and offsets from
// the bottom — (size - 150) leaves only 150px of track.
new ScrollMagic({
	element: '#d',
	triggerStart: 'center',
	triggerEnd: 'center',
	elementEnd: size => size - 150,
});

// Active only while the element is fully visible
// (both offsets pushed to the opposite edge = full element height)
new ScrollMagic({
	element: '#e',
	elementStart: 'opposite', // same as '100%'
	elementEnd: 'opposite', // same as '100%'
});
```

## API

```ts
const scene = new ScrollMagic(options);

// Event listeners
scene.on(type, callback); // add listener, returns scene (chainable)
scene.off(type, callback); // remove listener, returns scene (chainable)
scene.subscribe(type, callback); // add listener, returns unsubscribe function

// Modify options after creation
scene.modify({ triggerStart: 'center' });

// All options can also be directly read and written
const elem = scene.element; // get the tracked element
scene.triggerStart = 'center'; // set individual options

// Read-only getters
scene.progress; // 0–1, how far through the active zone
scene.scrollOffset; // { start, end } absolute scroll positions
scene.computedOptions; // resolved option values after computation

// Lifecycle
scene.destroy();

// Static
ScrollMagic.defaultOptions({ vertical: false }); // get/set defaults for new instances
```

## Plugins

ScrollMagic has a plugin system for extending instance behaviour.

```ts
const myPlugin: ScrollMagicPlugin = {
	name: 'my-plugin',
	onAdd() {
		// `this` is the ScrollMagic instance
		this.on('enter', () => {
			/* ... */
		});
	},
	onRemove() {
		this.off('enter' /* ... */);
	},
	onModify(changedOptions) {
		// react to option changes
	},
};

scene.addPlugin(myPlugin);
scene.removePlugin(myPlugin);
```

## Browser Support

Chrome 73+, Firefox 69+, Safari 13.1+, Edge 79+ (aligned to `ResizeObserver` support).

## License

MIT — [Jan Paepke](https://janpaepke.de)

<!-- TODO: link to extended documentation, demos, migration guide -->
