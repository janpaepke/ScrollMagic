import type { ContainerEvent } from './Container';
import { ContainerProxy } from './ContainerProxy';
import { EventDispatcher, type ListenerOptions } from './EventDispatcher';
import { ExecutionQueue } from './ExecutionQueue';
import * as Options from './Options';
import { processOptions, sanitizeOptions } from './Options.processors';
import { EventLocation, EventType, ScrollDirection, ScrollMagicEvent } from './ScrollMagicEvent';
import { agnosticProps, agnosticValues } from './util/agnosticValues';
import { getScrollPos } from './util/getScrollPos';
import { pickDifferencesFlat } from './util/pickDifferencesFlat';
import { observeResize } from './util/sharedResizeObserver';
import { numberToPercString } from './util/transformers';
import { isWindow } from './util/typeguards';
import { ViewportObserver } from './ViewportObserver';

const isBrowser = 'undefined' !== typeof window;

/** Cached layout measurements for the tracked element along the scroll axis. */
export type ElementBounds = {
	/** Position relative to viewport. */
	start: number;
	/** Outer visible size of element (excluding margins). */
	size: number;
	/** Offset relative to top/left of element. */
	offsetStart: number;
	/** Offset relative to bottom/right of element. */
	offsetEnd: number;
	/** Effective track size including offsets. */
	trackSize: number;
};
/** Cached layout measurements for the scroll container along the scroll axis. */
export type ContainerBounds = {
	/** Inner visible area of scroll container (excluding scrollbars). */
	clientSize: number;
	/** Offset relative to top/left of container. */
	offsetStart: number;
	/** Offset relative to bottom/right of container. */
	offsetEnd: number;
	/** Effective track size including offsets. */
	trackSize: number;
	/** Total size of content of container. */
	scrollSize: number;
};

/** Combined cached bounds for both the tracked element and its scroll container. */
export type ResolvedBounds = {
	/** Cached bounds of the tracked element. */
	element: Readonly<ElementBounds>;
	/** Cached bounds of the scroll container. */
	container: Readonly<ContainerBounds>;
};

/**
 * A ScrollMagic plugin. Plugins receive lifecycle callbacks bound to the ScrollMagic instance they are added to.
 *
 * All callbacks are optional. The `this` context inside each callback is the owning ScrollMagic instance.
 */
export interface Plugin {
	/** Unique name identifying this plugin. */
	name: string;
	/** Called when the plugin is added via {@link ScrollMagic.addPlugin}. */
	onAdd?(this: ScrollMagic): void;
	/** Called when the plugin is removed via {@link ScrollMagic.removePlugin}. */
	onRemove?(this: ScrollMagic): void;
	/** Called when the instance is enabled via {@link ScrollMagic.enable}. */
	onEnable?(this: ScrollMagic): void;
	/** Called when the instance is disabled via {@link ScrollMagic.disable}. */
	onDisable?(this: ScrollMagic): void;
	/** Called when the instance is destroyed via {@link ScrollMagic.destroy}. */
	onDestroy?(this: ScrollMagic): void;
	/** Called when options change via {@link ScrollMagic.modify}. Receives only the changed options. */
	onModify?(this: ScrollMagic, changesPublic: Options.Public): void;
}

/**
 * Core class for scroll-based animations. Each instance tracks a single DOM element
 * within a scroll container and reports scroll progress (0–1) through events.
 *
 * @example
 * ```js
 * const sm = new ScrollMagic({ element: '#hero' });
 * sm.on('progress', (e) => console.log(e.target.progress));
 * ```
 */
export class ScrollMagic {
	public readonly name = 'ScrollMagic';

	private resizeCleanup?: () => void;
	private readonly dispatcher = new EventDispatcher<ScrollMagicEvent>();
	private readonly containerProxy = new ContainerProxy(this);
	private readonly viewportObserver = new ViewportObserver(this.onIntersectionChange.bind(this));
	private readonly executionQueue = new ExecutionQueue({
		// The order is important here! They will always be executed in exactly this order when scheduled for the same animation frame
		elementBounds: this.updateElementBoundsCache.bind(this),
		containerBounds: this.updateContainerBoundsCache.bind(this),
		viewportObserver: this.updateViewportObserver.bind(this),
		progress: this.updateProgress.bind(this),
	});
	private readonly update = this.executionQueue.commands;
	private readonly plugins = new Set<Plugin>();
	protected readonly elementBoundsCache: ElementBounds = {
		// see typedef for details
		start: 0,
		size: 0,
		offsetStart: 0,
		offsetEnd: 0,
		trackSize: 0,
	};
	protected readonly containerBoundsCache: ContainerBounds = {
		// see typedef for details
		clientSize: 0,
		offsetStart: 0,
		offsetEnd: 0,
		trackSize: 0,
		scrollSize: 0,
	};

	// all below options should only ever be changed by a dedicated method
	protected optionsPublic!: Required<Options.Public>; // set in modify in constructor
	protected optionsPrivate!: Options.Private; // set in modify in constructor
	protected currentProgress = 0;
	protected intersecting?: boolean; // is the scene currently intersecting with the ViewportObserver?
	private destroyed = false; // instance is destroyed and cannot be used anymore, true if destroy() was called
	private enabled = true; // instance is enabled and can be used, false if disable() was called

	/**
	 * Create a new ScrollMagic instance.
	 *
	 * @param options - Configuration for the tracked element, scroll container, offsets, and axis.
	 *
	 * @example
	 * ```js
	 * // Track vertical scroll progress for an element
	 * const sm = new ScrollMagic({ element: '.section', container: '#scroller' });
	 *
	 * // Horizontal scroll with custom offsets
	 * const sm = new ScrollMagic({
	 *   element: '.panel',
	 *   vertical: false,
	 *   elementStart: '50%',
	 *   containerStart: 'center',
	 * });
	 * ```
	 */
	constructor(options: Options.Public = {}) {
		ScrollMagic.instances.add(this);
		const initOptions: Required<Options.Public> = {
			...ScrollMagic.defaultOptionsPublic,
			...options,
		};
		this.modify(initOptions);
	}

	private guardInert(): boolean {
		if (this.destroyed && (typeof process === 'undefined' || process.env.NODE_ENV !== 'production')) {
			console?.warn('ScrollMagic Warning: Method called on a destroyed instance.');
		}
		return this.destroyed || !isBrowser;
	}

	protected getViewportMargin(): { top: string; left: string; right: string; bottom: string } {
		const { vertical } = this.optionsPrivate;
		const { start: startProp, end: endProp } = agnosticProps(vertical);
		const { start: oppositeStartProp, end: oppositeEndProp } = agnosticProps(!vertical);
		const { scrollSize: oppositeScrollSize, clientSize: oppositeClientSize } = agnosticValues(
			!vertical, // retrieving the opposites
			this.containerProxy.rect // this is cached, so ok to get
		);
		const {
			clientSize: containerSize,
			offsetStart: containerOffsetStart,
			offsetEnd: containerOffsetEnd,
		} = this.containerBoundsCache;
		const { offsetStart, offsetEnd } = this.elementBoundsCache; // from cache

		const marginStart = containerSize - containerOffsetStart + offsetStart;
		const marginEnd = containerSize - containerOffsetEnd + offsetEnd;
		/**
		 ** confusingly IntersectionObserver (and thus ViewportObserver) treat margins in the opposite direction (negative means towards the center)
		 ** so we'll have to flip the signs here.
		 ** Additionally we convert it to percentages and round, as this means they are less likely to change, meaning less refreshes for the observer
		 ** (as the observer internally compares old values to new ones)
		 ** This way it won't have to internally create new IntersectionObservers, just because the container's size changes.
		 */
		const decimals = 10;
		const noSize = containerSize <= 0;
		const relMarginStart = noSize ? 0 : -marginStart / containerSize;
		const relMarginEnd = noSize ? 0 : -marginEnd / containerSize;

		// adding available scrollspace in opposite direction, so element never moves out of trackable area, even when scrolling horizontally on a vertical scene
		const noOppositeSize = oppositeClientSize <= 0;
		const scrollableOpposite =
			noOppositeSize ? 0 : numberToPercString((oppositeScrollSize - oppositeClientSize) / oppositeClientSize, decimals);
		return {
			// the start and end values are intentionally flipped here (start value defines end margin and vice versa)
			[endProp]: numberToPercString(relMarginStart, decimals),
			[startProp]: numberToPercString(relMarginEnd, decimals),
			[oppositeStartProp]: scrollableOpposite,
			[oppositeEndProp]: scrollableOpposite,
		} as Record<'top' | 'left' | 'bottom' | 'right', string>;
	}

	protected getTrackSize(): number {
		return this.elementBoundsCache.trackSize + this.containerBoundsCache.trackSize;
	}

	// !update functions MUST NOT call any other functions causing side effects, with the exceptions of modify and event triggers in progress

	protected updateIntersectingState(nextIntersecting: boolean | undefined): void {
		// doesn't have to be a method, but I want to keep modifications obvious (only called from update... methods)
		this.intersecting = nextIntersecting;
	}

	protected updateElementBoundsCache(): void {
		// console.log(this.optionsPrivate.element.id, 'bounds', new Date().getMilliseconds());
		// this should be called cautiously, getBoundingClientRect costs...
		const { elementStart, elementEnd, element, vertical } = this.optionsPrivate;
		const { start, size } = agnosticValues(vertical, element.getBoundingClientRect());
		this.elementBoundsCache.start = start;
		// only update if size has changed, otherwise we're recalculating the offsetStart and offsetEnd for no reason
		if (size !== this.elementBoundsCache.size) {
			const offsetStart = elementStart(size);
			const offsetEnd = elementEnd(size);
			Object.assign(this.elementBoundsCache, {
				size,
				offsetStart,
				offsetEnd,
				trackSize: size - offsetStart - offsetEnd,
			});
		}
	}

	protected updateContainerBoundsCache(): void {
		// console.log(this.optionsPrivate.element.id, 'container', new Date().getMilliseconds());
		const { containerStart, containerEnd, vertical } = this.optionsPrivate;
		const { clientSize, scrollSize } = agnosticValues(vertical, this.containerProxy.rect);
		const offsetStart = containerStart(clientSize);
		const offsetEnd = containerEnd(clientSize);
		Object.assign(this.containerBoundsCache, {
			clientSize,
			scrollSize,
			offsetStart,
			offsetEnd,
			trackSize: -(clientSize - offsetStart - offsetEnd), // container track is inverted (start is usually below end)
		});
	}

	protected updateProgress(): void {
		// console.log(this.optionsPrivate.element.id, 'progress', new Date().getMilliseconds());
		if (this.containerBoundsCache.clientSize <= 0) {
			return; // container has no visible area, progress is meaningless
		}
		const { offsetStart: elementOffset, start: elementPosition } = this.elementBoundsCache;
		const { offsetStart: containerOffset } = this.containerBoundsCache;
		const { start: containerPosition } = agnosticValues(this.optionsPrivate.vertical, this.containerProxy.rect);

		const elementStart = elementPosition + elementOffset;
		const containerStart = containerPosition + containerOffset;
		const passed = containerStart - elementStart;
		const total = this.getTrackSize();

		if (total < 0) {
			return; // no overlap of track and scroll distance
		}

		const previousProgress = this.currentProgress;
		const nextProgress = Math.min(Math.max(passed / total, 0), 1); // when leaving, it will overshoot, this normalises to 0 / 1 (also when total is 0)
		const deltaProgress = nextProgress - previousProgress;

		if (deltaProgress === 0) {
			return;
		}

		this.currentProgress = nextProgress;
		const forward = deltaProgress > 0;

		if (previousProgress === 0 || previousProgress === 1) {
			this.triggerEvent(EventType.Enter, forward);
		}
		this.triggerEvent(EventType.Progress, forward);
		if (nextProgress === 0 || nextProgress === 1) {
			this.triggerEvent(EventType.Leave, forward);
		}
	}

	protected updateViewportObserver(): void {
		if (this.containerBoundsCache.clientSize <= 0) {
			this.updateIntersectingState(undefined); // reset so intersection re-evaluates when container becomes visible
			return;
		}
		const { container, vertical } = this.optionsPrivate;
		const observerOptions = {
			margin: this.getViewportMargin(),
			root: isWindow(container) ? null : container,
			vertical,
		};
		this.viewportObserver.modify(observerOptions);
	}

	protected onOptionChanges(changedOptions: Options.Public): void {
		const changes = Object.keys(changedOptions) as Array<keyof Options.Public>;
		if (changes.length === 0) {
			return;
		}
		const isChanged = changes.includes.bind(changes);
		const directionChanged = isChanged('vertical');
		const elementBoundsInvalidated = directionChanged || isChanged('elementStart') || isChanged('elementEnd');

		if (elementBoundsInvalidated) {
			this.elementBoundsCache.size = NaN; // force converter recalculation (size guard in updateElementBoundsCache)
		}
		if (this.disabled) return;

		const elementChanged = isChanged('element');
		const containerChanged = isChanged('container');
		const containerBoundsInvalidated =
			containerChanged || directionChanged || isChanged('containerStart') || isChanged('containerEnd');

		if (elementBoundsInvalidated || elementChanged) {
			this.update.elementBounds.schedule();
		}
		if (elementChanged) {
			this.updateIntersectingState(undefined);
			const { element } = this.optionsPrivate;
			this.viewportObserver.disconnect();
			this.viewportObserver.observe(element);
			this.resizeCleanup?.();
			this.resizeCleanup = observeResize(element, this.onElementResize.bind(this));
		}
		if (containerBoundsInvalidated) {
			this.update.containerBounds.schedule();
			this.update.viewportObserver.schedule();
		}
		if (containerChanged) {
			this.updateIntersectingState(undefined);
			this.containerProxy.attach(this.optionsPrivate.container, this.onContainerUpdate.bind(this)); // container updates are already throttled
		}
		// if any options changes we always have to refresh the progress
		this.update.progress.schedule();
	}

	protected onElementResize(): void {
		/**
		 * * element resized
		 * updateContainerBounds => 	never
		 * updateElementBounds =>		schedule always (obviously),		execute regardless.
		 * updateViewportObserver => 	schedule always, 					execute if start or end offset changed in trigger bounds update above
		 * updateProgress => 			schedule if currently intersecting,	execute if bounds changed (offsets or size, since size affects trackSize)
		 */
		const { update } = this;
		// Capture previous values for lazy condition checks.
		// IMPORTANT: closures must reference `this.elementBoundsCache` (not a destructured local)
		// because `updateElementBoundsCache()` replaces the entire object reference.
		const { offsetStart: startPrevious, offsetEnd: endPrevious, size: sizePrevious } = this.elementBoundsCache;
		const isOffsetChanged = () =>
			startPrevious !== this.elementBoundsCache.offsetStart || endPrevious !== this.elementBoundsCache.offsetEnd;
		const isBoundsChanged = () => isOffsetChanged() || sizePrevious !== this.elementBoundsCache.size;
		update.elementBounds.schedule();
		update.viewportObserver.schedule(isOffsetChanged);
		if (this.intersecting) {
			update.progress.schedule(isBoundsChanged);
		}
	}

	protected onContainerUpdate(e: ContainerEvent): void {
		/**
		 * * container resized
		 * updateContainerBounds => 	schedule always							execute regardless
		 * updateElementBounds => 		schedule if currently intersecting, 	execute regardless (resizes are caught in onElementResize but position might change due to container resize, which wouldn't be)
		 * updateViewportObserver => 	schedule always (to get new margins),	execute regardless.
		 * updateProgress => 			schedule if currently intersecting, 	execute if position changed in triggerBounds update
		 */
		const { update } = this;
		if ('resize' === e.type) {
			this.update.containerBounds.schedule();
			if (this.intersecting) {
				update.elementBounds.schedule();
			}
			update.viewportObserver.schedule();
			const { start: startPrevious } = this.elementBoundsCache;
			const { clientSize: sizePrevious } = this.containerBoundsCache;
			const isChanged = () =>
				startPrevious !== this.elementBoundsCache.start || sizePrevious !== this.containerBoundsCache.clientSize;
			update.progress.schedule(isChanged);
			return;
		}
		/**
		 * * container scrolled
		 * if relevant scrollDelta is 0, do nothing (scroll was in other direction)
		 * updateContainerBounds => 	never
		 * updateElementBounds =>		schedule if currently intersecting,							execute regardless
		 * updateViewportObserver => 	never
		 * updateProgress =>			schedule if currently intersecting or potentially skipped, 	execute regardless (technically only execute if triggerBounds returned a new position, but that's implied, if there was a scoll move in the relevant direction)
		 */
		const { axis: scrollDelta } = agnosticValues(this.optionsPrivate.vertical, e.scrollDelta);
		if (0 === scrollDelta) {
			return; // scroll was in other direction
		}
		// in case the scroll position changes by more than the total track distance, the viewport observer might miss it.
		// this means running the progress update more than we have to, but in this case we have no choice.
		const potentiallySkipped = Math.abs(scrollDelta) > this.getTrackSize();

		if (!this.intersecting && !potentiallySkipped) {
			// if we're not intersecting and there's no danger we skipped the scene, we don't have to do anything...
			return;
		}
		update.elementBounds.schedule();
		update.progress.schedule();
	}

	protected onIntersectionChange(intersecting: boolean, target: Element): void {
		// the check below should always be true, as we only ever observe one element, but you can never be too sure, I guess...
		if (target === this.optionsPrivate.element) {
			/**
			 * * intersection state changed
			 * updateContainerBounds => 	never
			 * updateElementBounds =>		schedule regardless, if intersection state changed, position likely did, too.
			 * updateViewportObserver =>	never
			 * updateProgress =>			schedule regardless, execute regardless
			 */
			this.updateIntersectingState(intersecting);

			this.update.elementBounds.schedule();
			this.update.progress.schedule();
		}
	}

	protected triggerEvent(type: EventType, forward: boolean): void {
		this.dispatcher.dispatchEvent(new ScrollMagicEvent(this, type, forward));
	}

	/**
	 * Update one or more options on this instance. Only changed values trigger internal recalculations.
	 *
	 * @param options - Partial set of public options to merge.
	 * @returns The instance, for chaining.
	 *
	 * @example
	 * ```js
	 * sm.modify({ elementStart: '25%', containerEnd: 100 });
	 * ```
	 */
	public modify(options: Options.Public): ScrollMagic {
		if (this.guardInert()) {
			return this;
		}
		const { sanitized, processed } = processOptions(options, this.optionsPrivate);

		const changedOptions =
			(
				undefined === this.optionsPublic // not set on first run, so all changed
			) ?
				sanitized
			:	pickDifferencesFlat(sanitized, this.optionsPublic);

		this.optionsPublic = { ...this.optionsPublic, ...changedOptions };
		this.optionsPrivate = processed;

		this.onOptionChanges(changedOptions);
		this.plugins.forEach(plugin => plugin.onModify?.call(this, changedOptions));
		return this;
	}

	/**
	 * Register a plugin on this instance. The plugin's `onAdd` callback is invoked immediately.
	 *
	 * @param plugin - The plugin to add.
	 * @returns The instance, for chaining.
	 */
	public addPlugin(plugin: Plugin): ScrollMagic {
		if (this.guardInert()) {
			return this;
		}
		this.plugins.add(plugin);
		plugin.onAdd?.call(this);
		return this;
	}

	/**
	 * Unregister a plugin from this instance. The plugin's `onRemove` callback is invoked immediately.
	 *
	 * @param plugin - The plugin to remove.
	 * @returns The instance, for chaining.
	 */
	public removePlugin(plugin: Plugin): ScrollMagic {
		if (this.guardInert()) {
			return this;
		}
		this.plugins.delete(plugin);
		plugin.onRemove?.call(this);
		return this;
	}

	// getter/setter public

	/** Set the tracked element. Accepts an `Element`, a CSS selector, or `null` to reset. */
	public set element(element: Required<Options.Public>['element']) {
		this.modify({ element });
	}
	/** The resolved tracked DOM element. */
	public get element(): Options.Private['element'] {
		return this.optionsPrivate.element;
	}
	/** Set the start inset on the tracked element. Positive values shrink the tracked region from the leading edge. */
	public set elementStart(elementStart: Required<Options.Public>['elementStart']) {
		this.modify({ elementStart });
	}
	/** The current start inset value for the tracked element (as originally provided). */
	public get elementStart(): Required<Options.Public>['elementStart'] {
		return this.optionsPublic.elementStart;
	}
	/** Set the end inset on the tracked element. Positive values shrink the tracked region from the trailing edge. */
	public set elementEnd(elementEnd: Required<Options.Public>['elementEnd']) {
		this.modify({ elementEnd });
	}
	/** The current end inset value for the tracked element (as originally provided). */
	public get elementEnd(): Required<Options.Public>['elementEnd'] {
		return this.optionsPublic.elementEnd;
	}
	/** Set the scroll container. Accepts a `Window`, `Element`, CSS selector, or `null` to reset. */
	public set container(container: Required<Options.Public>['container']) {
		this.modify({ container });
	}
	/** The resolved scroll container (`Window` or `HTMLElement`). */
	public get container(): Options.Private['container'] {
		return this.optionsPrivate.container;
	}
	/** Set the start inset on the scroll container. Set to `null` to infer based on `element`. */
	public set containerStart(containerStart: Required<Options.Public>['containerStart']) {
		this.modify({ containerStart });
	}
	/** The current start inset value for the scroll container (as originally provided). */
	public get containerStart(): Required<Options.Public>['containerStart'] {
		return this.optionsPublic.containerStart;
	}
	/** Set the end inset on the scroll container. Set to `null` to infer based on `element`. */
	public set containerEnd(containerEnd: Required<Options.Public>['containerEnd']) {
		this.modify({ containerEnd });
	}
	/** The current end inset value for the scroll container (as originally provided). */
	public get containerEnd(): Required<Options.Public>['containerEnd'] {
		return this.optionsPublic.containerEnd;
	}
	/** Set the scroll axis. `true` = vertical, `false` = horizontal. */
	public set vertical(vertical: Required<Options.Public>['vertical']) {
		this.modify({ vertical });
	}
	/** Whether this instance tracks vertical (`true`) or horizontal (`false`) scroll. */
	public get vertical(): Options.Private['vertical'] {
		return this.optionsPrivate.vertical;
	}

	/** Current scroll progress through the active zone, from 0 (before) to 1 (past). */
	public get progress(): number {
		return this.currentProgress;
	}
	/** Raw scroll velocity in pixels per second along the tracked axis (no smoothing). Returns 0 when disabled or not scrolling. */
	public get scrollVelocity(): number {
		if (this.disabled) {
			return 0;
		}
		const { axis } = agnosticValues(this.optionsPrivate.vertical, this.containerProxy.scrollVelocity);
		return axis;
	}
	/** Returns the absolute scroll positions at which the scene starts and ends. Triggers a synchronous layout read (cached values when disabled). */
	public get scrollOffset(): { start: number; end: number } {
		if (this.guardInert()) {
			return { start: 0, end: 0 };
		}
		if (!this.disabled) {
			this.updateElementBoundsCache(); // need to get fresh position — skip when disabled to avoid mixing fresh element bounds with stale container bounds
		}
		const { container, vertical } = this.optionsPrivate;
		const { start: elementPosition, offsetStart, trackSize } = this.elementBoundsCache;
		const {
			clientSize: containerSize,
			offsetStart: containerOffsetStart,
			offsetEnd: containerOffsetEnd,
		} = this.containerBoundsCache;
		const { start: scrollOffset } = agnosticValues(vertical, getScrollPos(container));

		const absolutePosition = elementPosition + scrollOffset;
		const start = absolutePosition + offsetStart;
		const end = start + trackSize;
		return {
			start: Math.floor(start - containerOffsetStart),
			end: Math.ceil(end - containerSize + containerOffsetEnd),
		};
	}
	/** Resolved pixel offsets for container zone and element boundaries, based on current layout. */
	public get resolvedBounds(): Readonly<ResolvedBounds> {
		return {
			element: { ...this.elementBoundsCache },
			container: { ...this.containerBoundsCache },
		};
	}
	/** Snapshot of all currently registered plugins. */
	public get pluginList(): Array<Plugin> {
		return [...this.plugins];
	}
	/** Whether tracking is currently paused (via `disable()`) or the instance has been destroyed. */
	public get disabled(): boolean {
		return !this.enabled || this.destroyed;
	}

	public get [Symbol.toStringTag](): string {
		return this.name;
	}

	/**
	 * Add an event listener.
	 *
	 * @param type - The event type to listen for.
	 * @param cb - Callback invoked with a {@link ScrollMagicEvent}.
	 * @param options - Optional settings, e.g. `{ once: true }` to auto-remove after first invocation.
	 * @returns The instance, for chaining.
	 *
	 * @example
	 * ```js
	 * sm.on('progress', (e) => {
	 *   console.log(e.target.progress); // 0–1
	 * });
	 *
	 * // Fire only once
	 * sm.on('enter', (e) => console.log('entered!'), { once: true });
	 * ```
	 */
	public on(type: `${EventType}`, cb: (e: ScrollMagicEvent) => void, options?: ListenerOptions): ScrollMagic {
		if (this.guardInert()) {
			return this;
		}
		this.dispatcher.addEventListener(type, cb, options);
		return this;
	}
	/**
	 * Remove a previously registered event listener.
	 *
	 * @param type - The event type the listener was registered for.
	 * @param cb - The exact callback reference passed to {@link on}.
	 * @returns The instance, for chaining.
	 */
	public off(type: `${EventType}`, cb: (e: ScrollMagicEvent) => void): ScrollMagic {
		if (this.guardInert()) {
			return this;
		}
		this.dispatcher.removeEventListener(type, cb);
		return this;
	}
	/**
	 * Add an event listener and receive a disposer function to remove it.
	 * Unlike {@link on}, this is not chainable — it returns the unsubscribe function instead.
	 *
	 * @param type - The event type to listen for.
	 * @param cb - Callback invoked with a {@link ScrollMagicEvent}.
	 * @param options - Optional settings, e.g. `{ once: true }`.
	 * @returns A function that removes the listener when called.
	 *
	 * @example
	 * ```js
	 * const unsub = sm.subscribe('enter', (e) => console.log('entered!'));
	 * // Later:
	 * unsub();
	 * ```
	 */
	public subscribe(type: `${EventType}`, cb: (e: ScrollMagicEvent) => void, options?: ListenerOptions): () => void {
		if (this.guardInert()) {
			return () => {};
		}
		return this.dispatcher.addEventListener(type, cb, options);
	}

	/**
	 * Schedule a full recalculation of element bounds, container bounds, viewport observer, and progress.
	 *
	 * @remarks Updates run asynchronously on the next animation frame.
	 * @returns The instance, for chaining.
	 */
	public refresh(): ScrollMagic {
		if (this.guardInert() || this.disabled) {
			return this;
		}
		this.update.elementBounds.schedule();
		this.update.containerBounds.schedule();
		this.update.viewportObserver.schedule();
		this.update.progress.schedule();
		return this;
	}

	/**
	 * Pause tracking — disconnects all observers and freezes progress.
	 * Options can still be modified while disabled.
	 *
	 * @returns The instance, for chaining.
	 * @see {@link enable} to resume tracking.
	 *
	 * @example
	 * ```js
	 * sm.disable();
	 * // progress and events are frozen
	 * sm.enable(); // resume
	 * ```
	 */
	public disable(): ScrollMagic {
		if (this.guardInert() || this.disabled) return this;
		this.enabled = false;
		this.executionQueue.cancel();
		this.resizeCleanup?.();
		this.resizeCleanup = undefined;
		this.viewportObserver.disconnect();
		this.containerProxy.detach();
		this.plugins.forEach(plugin => plugin.onDisable?.call(this));
		return this;
	}

	/**
	 * Resume tracking — reconnects all observers and recalculates from current state.
	 *
	 * @returns The instance, for chaining.
	 * @see {@link disable} to pause tracking.
	 *
	 * @example
	 * ```js
	 * sm.enable();
	 * ```
	 */
	public enable(): ScrollMagic {
		if (this.guardInert() || this.enabled) return this;
		this.enabled = true;
		const { element, container } = this.optionsPrivate;
		this.updateIntersectingState(undefined);
		this.viewportObserver.observe(element);
		this.resizeCleanup = observeResize(element, this.onElementResize.bind(this));
		this.containerProxy.attach(container, this.onContainerUpdate.bind(this));
		this.elementBoundsCache.size = NaN; // force converter recalculation
		this.update.elementBounds.schedule();
		this.update.containerBounds.schedule();
		this.update.viewportObserver.schedule();
		this.update.progress.schedule();
		this.plugins.forEach(plugin => plugin.onEnable?.call(this));
		return this;
	}

	/**
	 * Permanently tear down this instance — disconnects all observers, removes all plugins,
	 * and deregisters from {@link ScrollMagic.refreshAll} / {@link ScrollMagic.destroyAll}.
	 * The instance cannot be used after calling this method.
	 */
	public destroy(): void {
		if (this.destroyed || !isBrowser) {
			return;
		}
		this.disable(); // tear down observers (no-ops if already disabled), fires onDisable
		this.destroyed = true;
		ScrollMagic.instances.delete(this);
		this.plugins.forEach(plugin => plugin.onDestroy?.call(this));
		this.plugins.clear();
	}

	// static options/methods

	private static readonly instances = new Set<ScrollMagic>();
	/** Schedule a full recalculation on all active ScrollMagic instances. */
	public static refreshAll(): void {
		ScrollMagic.instances.forEach(instance => instance.refresh());
	}
	/** Destroy all active ScrollMagic instances. */
	public static destroyAll(): void {
		ScrollMagic.instances.forEach(instance => instance.destroy());
	}

	protected static defaultOptionsPublic = Options.defaults;
	/**
	 * Get or update the default options applied to all future ScrollMagic instances.
	 *
	 * @param options - Partial options to merge into the current defaults.
	 * @returns The full set of current default options.
	 *
	 * @example
	 * ```js
	 * // Set a global default container
	 * ScrollMagic.defaultOptions({ container: '#main-scroller' });
	 *
	 * // Read current defaults
	 * const defaults = ScrollMagic.defaultOptions();
	 * ```
	 */
	public static defaultOptions(options: Options.Public = {}): Required<Options.Public> {
		this.defaultOptionsPublic = {
			...this.defaultOptionsPublic,
			...sanitizeOptions(options),
		};
		return this.defaultOptionsPublic;
	}
	/** Enum of event types: `Enter`, `Leave`, `Progress`. @see {@link EventType} */
	public static readonly EventType = EventType;
	/** Enum of event locations: `Start`, `Inside`, `End`. @see {@link EventLocation} */
	public static readonly EventLocation = EventLocation;
	/** Enum of scroll directions: `Forward`, `Reverse`. @see {@link ScrollDirection} */
	public static readonly EventScrollDirection = ScrollDirection;
}
