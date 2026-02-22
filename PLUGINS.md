# ScrollMagic Plugins

Plugins extend ScrollMagic instances with custom behaviour — class toggles, debug overlays, animation bindings, or anything else. Each plugin is a plain object with a `name` and optional lifecycle hooks.

## Basic Example

```ts
import ScrollMagic, { type ScrollMagicPlugin } from 'scrollmagic';

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
};

const scene = new ScrollMagic({ element: '#target' });
scene.addPlugin(myPlugin);
scene.removePlugin(myPlugin); // or let destroy() handle cleanup
```

## Lifecycle Hooks

All hooks are optional. In every hook, `this` is bound to the ScrollMagic instance the plugin is attached to.

| Hook | When it fires |
| --- | --- |
| `onAdd()` | Immediately when `addPlugin()` is called. |
| `onRemove()` | When `removePlugin()` is called. The instance is still alive. |
| `onEnable()` | When `enable()` resumes tracking. |
| `onDisable()` | When `disable()` pauses tracking. Also fires during `destroy()` (before `onDestroy`) if the instance was enabled. |
| `onDestroy()` | When `destroy()` tears down the instance. The instance is already disabled at this point. |
| `onModify(changes)` | When options change via `modify()` or a setter. `changes` contains only the options that actually changed. |

### Hook Sequence

**`removePlugin(plugin)`** fires `onRemove` only.

**`destroy()`** on an enabled instance fires in order:

1. `onDisable` — tracking paused (observers disconnected)
2. `onDestroy` — instance dying (final cleanup)

If the instance was already disabled before `destroy()`, only `onDestroy` fires.

Note: `onRemove` does **not** fire during `destroy()`. Use `onDestroy` for teardown cleanup. If a plugin needs the same cleanup logic for both removal and destruction, assign the same function to both hooks:

```ts
const cleanup = function (this: ScrollMagic) {
	/* ... */
};
const plugin: ScrollMagicPlugin = {
	name: 'shared-cleanup',
	onRemove: cleanup,
	onDestroy: cleanup,
};
```

## Using Utilities

ScrollMagic exposes direction-agnostic helpers via a separate entry point. These are useful for plugins that need to work with both vertical and horizontal scrolling:

```ts
import { agnosticValues, agnosticProps } from 'scrollmagic/util';
```

- **`agnosticProps(vertical)`** — returns a map of direction-neutral prop names (`start`, `end`, `size`, etc.) to their CSS/DOM equivalents (`top`/`left`, `bottom`/`right`, `height`/`width`, etc.).
- **`agnosticValues(vertical, obj)`** — extracts the relevant values from a rect or similar object based on scroll direction. For example, `agnosticValues(true, element.getBoundingClientRect())` returns `{ start: rect.top, end: rect.bottom, size: rect.height, ... }`.

## Plugin Instance Methods

These methods are available on every ScrollMagic instance — plugins use them via `this` in hooks:

```ts
// Event listeners
this.on(type, callback);
this.off(type, callback);
this.subscribe(type, callback); // returns unsubscribe function

// Read state
this.progress; // 0–1
this.disabled; // true when disabled or destroyed
this.scrollVelocity; // px/s along tracked axis
this.scrollOffset; // { start, end } absolute scroll positions
this.resolvedBounds; // { element, scrollParent } cached layout bounds

// Read/write options
this.element;
this.scrollParent;
this.vertical;
this.triggerStart;
this.triggerEnd;
this.elementStart;
this.elementEnd;

// Actions
this.modify(options); // update multiple options at once
this.refresh(); // force bounds recalculation
this.enable();
this.disable();
this.destroy();

// Plugin management
this.addPlugin(plugin);
this.removePlugin(plugin);
this.pluginList; // snapshot of registered plugins
```
