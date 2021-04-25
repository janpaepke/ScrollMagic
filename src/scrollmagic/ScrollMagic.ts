import { ContainerEvent } from './Container';
import { ContainerProxy } from './ContainerProxy';
import EventDispatcher from './EventDispatcher';
import { ExecutionQueue } from './ExecutionQueue';
import * as Options from './Options';
import { process as processOptions, sanitize as sanitizeOptions } from './Options.processors';
import ScrollMagicEvent, { EventType, ScrollMagicEventType } from './ScrollMagicEvent';
import getScrollPos from './util/getScrollPos';
import pickDifferencesFlat from './util/pickDifferencesFlat';
import { pickRelevantProps, pickRelevantValues } from './util/pickRelevantInfo';
import { roundToDecimals } from './util/roundToDecimals';
import throttleRaf from './util/throttleRaf';
import { numberToPercString } from './util/transformers';
import { isUndefined, isWindow } from './util/typeguards';
import ViewportObserver from './ViewportObserver';

type ElementBounds = {
	start: number; //		position relative to viewport
	size: number; // 		outer visible size of element (excluding margins)
	offsetStart: number; // offset relative to top/left of element
	offsetEnd: number; // 	offset relative to bottom/right of element
	trackSize: number; // 	effective track size including offsets
};
type ContainerBounds = {
	clientSize: number; //	inner visible area of scroll container (excluding scrollbars)
	offsetStart: number; // offset relative to top/left of container
	offsetEnd: number; // 	offset relative to bottom/right of container
	trackSize: number; // 	effective track size including offsets
	scrollSize: number; //	total size of content of container
};
export class ScrollMagic {
	public readonly name = 'ScrollMagic';

	private readonly dispatcher = new EventDispatcher();
	private readonly container = new ContainerProxy(this);
	private readonly resizeObserver = new ResizeObserver(throttleRaf(this.onElementResize.bind(this)));
	private readonly viewportObserver = new ViewportObserver(this.onIntersectionChange.bind(this));
	private readonly executionQueue = new ExecutionQueue({
		// The order is important here! They will always be executed in exactly this order when scheduled for the same animation frame
		elementBounds: this.updateElementBoundsCache.bind(this),
		containerBounds: this.updateContainerBoundsCache.bind(this),
		viewportObserver: this.updateViewportObserver.bind(this),
		progress: this.updateProgress.bind(this),
	});
	private readonly update = this.executionQueue.commands; // not sure this is good style, but I kind of don't want to write this.executionQueue.commands every time...

	// all below options should only ever be changed by a dedicated method
	protected optionsPublic!: Required<Options.Public>; // set in modify in constructor
	protected optionsPrivate!: Options.Private; // set in modify in constructor
	protected elementBoundsCache: ElementBounds = {
		// see typedef for details
		start: 0,
		size: 0,
		offsetStart: 0,
		offsetEnd: 0,
		trackSize: 0,
	};
	protected containerBoundsCache: ContainerBounds = {
		// see typedef for details
		clientSize: 0,
		offsetStart: 0,
		offsetEnd: 0,
		trackSize: 0,
		scrollSize: 0,
	};
	protected currentProgress = 0;
	protected intersecting?: boolean; // is the scene currently intersecting with the ViewportObserver?

	// TODO: build plugin interface
	// TODO: correctly take into account container position, if not window
	// TODO: fix if container size is 0
	// TODO: Maybe only include internal errors for development? process.env...
	constructor(options: Options.Public = {}) {
		const initOptions: Required<Options.Public> = {
			...ScrollMagic.defaultOptionsPublic,
			...options,
		};
		this.modify(initOptions);
	}

	protected getViewportMargin(): { top: string; left: string; right: string; bottom: string } {
		const { vertical } = this.optionsPrivate;
		const { start: startProp, end: endProp } = pickRelevantProps(vertical);
		const { start: oppositeStartProp, end: oppositeEndProp } = pickRelevantProps(!vertical);
		const { scrollSize: oppositeScrollSize, clientSize: oppositeClientSize } = pickRelevantValues(
			!vertical, // retrieving the opposites
			this.container.rect // this is cached, so ok to get
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
		 ** This way it won't have to internally create new IntersectionObservers, just because the scrollparent's size changes.
		 */
		const noSize = containerSize <= 0;
		const relMarginStart = noSize ? 0 : -roundToDecimals(marginStart / containerSize, 5);
		const relMarginEnd = noSize ? 0 : -roundToDecimals(marginEnd / containerSize, 5);

		// adding available scrollspace in opposite direction, so element never moves out of trackable area, even when scrolling horizontally on a vertical scene
		const noOppositeSize = oppositeClientSize <= 0;
		const scrollableOpposite = noOppositeSize
			? 0
			: numberToPercString((oppositeScrollSize - oppositeClientSize) / oppositeClientSize);
		return {
			// the start and end values are intentionally flipped here (start value defines end margin and vice versa)
			[endProp]: numberToPercString(relMarginStart),
			[startProp]: numberToPercString(relMarginEnd),
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
		// check variable initialisation for property description
		const { elementStart, elementEnd, element, vertical } = this.optionsPrivate;
		const { start, size } = pickRelevantValues(vertical, element.getBoundingClientRect());
		const offsetStart = elementStart(size);
		const offsetEnd = elementEnd(size);
		this.elementBoundsCache = {
			start,
			size,
			offsetStart,
			offsetEnd,
			trackSize: size - offsetStart - offsetEnd,
		};
	}

	protected updateContainerBoundsCache(): void {
		// console.log(this.optionsPrivate.element.id, 'container', new Date().getMilliseconds());
		// check variable initialisation for property description
		const { triggerStart, triggerEnd, vertical } = this.optionsPrivate;
		const { clientSize, scrollSize } = pickRelevantValues(vertical, this.container.rect);
		const offsetStart = triggerStart(clientSize);
		const offsetEnd = triggerEnd(clientSize);
		this.containerBoundsCache = {
			clientSize,
			scrollSize,
			offsetStart,
			offsetEnd,
			trackSize: -(clientSize - offsetStart - offsetEnd), // container track is inverted (start is usually below end)
		};
	}

	protected updateProgress(): void {
		// console.log(this.optionsPrivate.element.id, 'progress', new Date().getMilliseconds());
		const { offsetStart, start: elementPosition } = this.elementBoundsCache;
		const { offsetStart: containerStart } = this.containerBoundsCache;

		const elementStart = elementPosition + offsetStart;
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
		const { scrollParent } = this.optionsPrivate;
		const observerOptions = {
			margin: this.getViewportMargin(),
			root: isWindow(scrollParent) ? null : scrollParent,
		};
		this.viewportObserver.modify(observerOptions);
	}

	protected onOptionChanges(changes: Array<keyof Options.Private>): void {
		const isChanged = changes.includes.bind(changes);
		const sizeChanged = isChanged('elementStart');
		const offsetChanged = isChanged('elementEnd');
		const elementChanged = isChanged('element');
		const scrollParentChanged = isChanged('scrollParent');

		if (sizeChanged || offsetChanged || elementChanged) {
			this.update.elementBounds.schedule();
			if (elementChanged) {
				this.updateIntersectingState(undefined);
				const { element } = this.optionsPrivate;
				this.viewportObserver.disconnect();
				this.viewportObserver.observe(element);
				this.resizeObserver.disconnect();
				this.resizeObserver.observe(element);
			}
		}
		if (scrollParentChanged) {
			this.update.containerBounds.schedule();
			this.updateIntersectingState(undefined);
			this.container.attach(this.optionsPrivate.scrollParent, this.onContainerUpdate.bind(this)); // container updates are already throttled
		}
		// if the options change we always have to refresh the viewport observer, regardless which one it is...
		this.update.viewportObserver.schedule();
	}

	protected onElementResize(): void {
		/**
		 * * element resized
		 * updateContainerBounds => 	never
		 * updateElementBounds =>		schedule always (obviously),		execute regardless.
		 * updateViewportObserver => 	schedule always, 					execute if start or end offset changed in trigger bounds update above
		 * updateProgress => 			schedule if currently intersecting,	execute if start or end offset changed in trigger bounds update above
		 */
		const { update, elementBoundsCache } = this;
		const { offsetStart: startPrevious, offsetEnd: endPrevious } = elementBoundsCache;
		const isBoundsChanged = () =>
			startPrevious !== elementBoundsCache.offsetStart || endPrevious !== elementBoundsCache.offsetEnd;
		update.elementBounds.schedule();
		update.viewportObserver.schedule(isBoundsChanged);
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
			const isPositionChanged = () => startPrevious !== this.elementBoundsCache.start;
			update.progress.schedule(isPositionChanged);
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
		const { scrollDelta } = pickRelevantValues(this.optionsPrivate.vertical, e.scrollDelta);
		if (0 === scrollDelta) {
			return; // scroll was in other direction
		}
		// in case the scroll position changes by more than the total track distance, the viewport observer might miss it.
		// this means running the progress update more than we have to, but in this case we have no choice.
		const potentiallySkipped = Math.abs(scrollDelta) > this.getTrackSize();

		if (!this.intersecting && !potentiallySkipped) {
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
			 * updateElementBounds =>		never (would be caught by onElementResize or onContainerUpdate)
			 * updateViewportObserver =>	never
			 * updateProgress =>			schedule regardless, execute regardless
			 */
			this.updateIntersectingState(intersecting);
			this.update.progress.schedule();
		}
	}

	protected triggerEvent(type: ScrollMagicEventType, forward: boolean): void {
		this.dispatcher.dispatchEvent(new ScrollMagicEvent(this, type, forward));
	}

	public modify(options: Options.Public): ScrollMagic {
		const { sanitized, processed } = processOptions(options, this.optionsPrivate);

		this.optionsPublic = { ...this.optionsPublic, ...sanitized };

		const changed = isUndefined(this.optionsPrivate) // internal options not set on first run, so all changed
			? processed
			: pickDifferencesFlat(processed, this.optionsPrivate);
		const changedOptions = Object.keys(changed) as Array<keyof Options.Private>;

		if (changedOptions.length === 0) {
			return this;
		}

		this.optionsPrivate = processed;

		this.onOptionChanges(changedOptions);
		return this;
	}

	// getter/setter public
	public set element(element: Required<Options.Public>['element']) {
		this.modify({ element });
	}
	public get element(): Required<Options.Public>['element'] {
		return this.optionsPublic.element;
	}
	public set scrollParent(scrollParent: Required<Options.Public>['scrollParent']) {
		this.modify({ scrollParent });
	}
	public get scrollParent(): Required<Options.Public>['scrollParent'] {
		return this.optionsPublic.scrollParent;
	}
	public set vertical(vertical: Required<Options.Public>['vertical']) {
		this.modify({ vertical });
	}
	public get vertical(): Required<Options.Public>['vertical'] {
		return this.optionsPublic.vertical;
	}
	public set triggerStart(triggerStart: Required<Options.Public>['triggerStart']) {
		this.modify({ triggerStart });
	}
	public get triggerStart(): Required<Options.Public>['triggerStart'] {
		return this.optionsPublic.triggerStart;
	}
	public set triggerEnd(triggerEnd: Required<Options.Public>['triggerEnd']) {
		this.modify({ triggerEnd });
	}
	public get triggerEnd(): Required<Options.Public>['triggerEnd'] {
		return this.optionsPublic.triggerEnd;
	}
	public set elementStart(elementStart: Required<Options.Public>['elementStart']) {
		this.modify({ elementStart });
	}
	public get elementStart(): Required<Options.Public>['elementStart'] {
		return this.optionsPublic.elementStart;
	}
	public set elementEnd(elementEnd: Required<Options.Public>['elementEnd']) {
		this.modify({ elementEnd });
	}
	public get elementEnd(): Required<Options.Public>['elementEnd'] {
		return this.optionsPublic.elementEnd;
	}

	// not an option -> getter only
	public get progress(): number {
		return this.currentProgress;
	}
	public get scrollOffset(): { start: number; end: number } {
		this.updateElementBoundsCache(); // need to get frash position
		const { scrollParent, vertical } = this.optionsPrivate;
		const { start: elementPosition, offsetStart, trackSize } = this.elementBoundsCache;
		const {
			clientSize: containerSize,
			offsetStart: containerOffsetStart,
			offsetEnd: containerOffsetEnd,
		} = this.containerBoundsCache;
		const { start: scrollOffset } = pickRelevantValues(vertical, getScrollPos(scrollParent));

		const absolutePosition = elementPosition + scrollOffset;
		const start = absolutePosition + offsetStart;
		const end = start + trackSize;
		return {
			start: Math.floor(start - containerOffsetStart),
			end: Math.ceil(end - containerSize + containerOffsetEnd),
		};
	}
	public get computedOptions(): Options.PrivateComputed {
		const { offsetStart: triggerStart, offsetEnd: triggerEnd } = this.containerBoundsCache;
		const { offsetStart: elementStart, offsetEnd: elementEnd } = this.elementBoundsCache;
		return {
			...this.optionsPrivate,
			triggerStart,
			triggerEnd,
			elementStart,
			elementEnd,
		};
	}

	// event listener
	public on(type: ScrollMagicEventType, cb: (e: ScrollMagicEvent) => void): ScrollMagic {
		this.dispatcher.addEventListener(type as ScrollMagicEventType, cb);
		return this;
	}
	public off(type: ScrollMagicEventType, cb: (e: ScrollMagicEvent) => void): ScrollMagic {
		this.dispatcher.removeEventListener(type as ScrollMagicEventType, cb);
		return this;
	}
	// same as on, but returns a function to reverse the effect (remove the listener), so not chainable.
	public subscribe(type: ScrollMagicEventType, cb: (e: ScrollMagicEvent) => void): () => void {
		return this.dispatcher.addEventListener(type as ScrollMagicEventType, cb);
	}

	public destroy(): void {
		this.executionQueue.cancel();
		this.resizeObserver.disconnect();
		this.viewportObserver.disconnect();
		this.container.detach();
	}

	// static options/methods

	protected static defaultOptionsPublic = Options.defaults;
	// get or change default options
	public static defaultOptions(options: Options.Public = {}): Required<Options.Public> {
		this.defaultOptionsPublic = {
			...this.defaultOptionsPublic,
			...sanitizeOptions(options),
		};
		return this.defaultOptionsPublic;
	}
}
