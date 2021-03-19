import { ContainerEvent } from './Container';
import { ContainerProxy } from './ContainerProxy';
import EventDispatcher from './EventDispatcher';
import { ThrottledExecutionQueue } from './ExecutionQueue';
import * as Options from './Options';
import {
	compute as computeOptions,
	process as processOptions,
	sanitize as sanitizeOptions,
} from './Options.processors';
import ScrollMagicEvent, { ScrollMagicEventType } from './ScrollMagicEvent';
import getScrollPos from './util/getScrollPos';
import pickDifferencesFlat from './util/pickDifferencesFlat';
import { pickRelevantProps, pickRelevantValues } from './util/pickRelevantInfo';
import { roundToDecimals } from './util/roundToDecimals';
import throttleRaf from './util/throttleRaf';
import { numberToPercString } from './util/transformers';
import { isUndefined, isWindow } from './util/typeguards';
import ViewportObserver from './ViewportObserver';

export { Public as ScrollMagicOptions } from './Options';

// used for listeners to allow the value to be passed in either from the enum or as a string literal
type EventTypeEnumOrUnion = ScrollMagicEventType | `${ScrollMagicEventType}`;
export class ScrollMagic {
	public readonly name = 'ScrollMagic';

	private readonly dispatcher = new EventDispatcher();
	private readonly container = new ContainerProxy(this);
	private readonly resizeObserver = new ResizeObserver(throttleRaf(this.onElementResize.bind(this)));
	private readonly viewportObserver = new ViewportObserver(this.onIntersectionChange.bind(this));
	private readonly executionQueue = new ThrottledExecutionQueue();
	private readonly boundMethods = {
		// these are set to get permanent references for the throttled execution queue
		updateProgress: this.updateProgress.bind(this),
		updateViewportObserver: this.updateViewportObserver.bind(this),
		updateTriggerBounds: this.updateElementBoundsCache.bind(this),
	} as const;

	// all below options should only ever be changed by a dedicated method
	// update function MUST NOT call any other functions, with the exceptions of modify
	private optionsPublic: Options.Public = ScrollMagic.defaultOptionsPublic;
	private optionsPrivate!: Options.Private; // set in modify in constructor
	private elementBoundsCache: { start: number; offsetStart: number; offsetEnd: number; size: number } = {
		start: 0, // position relative to viewport
		offsetStart: 0, // offset relative to top/left of element
		offsetEnd: 0, // offset relative to bottom/right of element
		size: 0, // actual size of element
	};
	private currentProgress = 0;
	private active?: boolean; // scene active state

	// TODO! BUGFIX scrolling too fast breaks it (use keyboard to go to top / bottom of page)
	// TODO: Don't update triggerBoundsCache in updateProgress, but add it to the scheduling
	// TODO: Execution Queue: Make sure items are always executed in the expected order
	// TODO: properly react to mobile headers resizing
	// TODO: build plugin interface
	// TODO: consider what should actually be private and what protected.
	// TODO: Maybe only include internal errors for development? process.env...
	constructor(options: Partial<Options.Public> = {}) {
		const initOptions: Options.Public = {
			...ScrollMagic.defaultOptionsPublic,
			...options,
		};
		this.modify(initOptions);
	}

	private triggerEvent(type: ScrollMagicEventType, deltaProgress: number) {
		if (deltaProgress === 0) {
			return;
		}
		this.dispatcher.dispatchEvent(new ScrollMagicEvent(type, deltaProgress > 0, this));
	}

	public modify(options: Partial<Options.Public>): ScrollMagic {
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

	private getViewportMargin() {
		const { triggerStart, triggerEnd, vertical } = this.optionsPrivate;
		const { start: startProp, end: endProp } = pickRelevantProps(vertical);
		const { start: oppositeStartProp, end: oppositeEndProp } = pickRelevantProps(!vertical);
		const { clientSize: containerSize } = this.getContainerBounds();
		const { scrollSize: oppositeScrollSize, clientSize: oppositeClientSize } = this.getContainerBounds(!vertical); // gets the opposites
		const { offsetStart, offsetEnd } = this.elementBoundsCache; // from cache

		const marginStart = containerSize - triggerStart(containerSize) + offsetStart;
		const marginEnd = containerSize - triggerEnd(containerSize) + offsetEnd;
		/**
		 ** confusingly IntersectionObserver (and thus ViewportObserver) treat margins in the opposite direction (negative means towards the center)
		 ** so we'll have to flip the signs here.
		 ** Additionally we convert it to percentages and round, as this means they are less likely to change, meaning less refreshes for the observer
		 ** (as the observer internally compares old values to new ones)
		 ** This way it won't have to internally create new IntersectionObservers, just because the scrollparent's size changes.
		 */
		const relMarginStart = -roundToDecimals(marginStart / containerSize, 5);
		const relMarginEnd = -roundToDecimals(marginEnd / containerSize, 5);

		// adding available scrollspace in opposite direction, so element never moves out of trackable area, even when scrolling horizontally on a vertical scene
		const scrollableOpposite = numberToPercString((oppositeScrollSize - oppositeClientSize) / oppositeClientSize);
		return {
			// the start and end values are intentionally flipped here (start value defines end margin and vice versa)
			[endProp]: numberToPercString(relMarginStart),
			[startProp]: numberToPercString(relMarginEnd),
			[oppositeStartProp]: scrollableOpposite,
			[oppositeEndProp]: scrollableOpposite,
		} as Record<'top' | 'left' | 'bottom' | 'right', string>;
	}

	private getElementBounds() {
		// this should be called cautiously, getBoundingClientRect costs...
		// check variable initialisation for property description
		const { elementStart, elementEnd, element, vertical } = this.optionsPrivate;
		const { start, size: elementSize } = pickRelevantValues(vertical, element.getBoundingClientRect());
		return {
			start,
			offsetStart: elementStart(elementSize),
			offsetEnd: elementEnd(elementSize),
			size: elementSize,
		};
	}

	private getContainerBounds(forceDirection?: boolean) {
		return pickRelevantValues(forceDirection ?? this.optionsPrivate.vertical, this.container.rect); // these are already cached. fine to call as often as we like
	}

	private updateActive(nextActive: boolean | undefined) {
		// doesn't have to be a method, but I want to keep modifications obvious (only called from update... methods)
		this.active = nextActive;
	}

	private updateElementBoundsCache() {
		this.elementBoundsCache = this.getElementBounds();
	}

	private updateProgress() {
		if (false === this.active) {
			// also run if active is undefined (ViewportObserver not ready)
			return;
		}

		const { triggerStart, triggerEnd } = this.optionsPrivate;
		// todo cache on scroll!
		const { offsetStart, offsetEnd, size: elementSize, start: elementPosition } = this.getElementBounds(); // get fresh
		const { clientSize: containerSize } = this.getContainerBounds();

		const containerOffsetStart = triggerStart(containerSize);
		const containerOffsetEnd = triggerEnd(containerSize);
		const start = elementPosition + offsetStart;
		const elementDistance = elementSize - offsetStart - offsetEnd;
		const trackDistance = -(containerSize - containerOffsetStart - containerOffsetEnd);

		const passed = containerOffsetStart - start;
		const total = elementDistance + trackDistance;

		if (total < 0) {
			// no overlap of track and scroll distance
			return;
		}

		const previousProgress = this.currentProgress;
		const nextProgress = Math.min(Math.max(passed / total, 0), 1); // when leaving, it will overshoot, this normalises to 0 / 1
		const deltaProgress = nextProgress - previousProgress;

		this.currentProgress = nextProgress;

		if (previousProgress === 0 || previousProgress === 1) {
			this.triggerEvent(ScrollMagicEventType.Enter, deltaProgress);
		}
		this.triggerEvent(ScrollMagicEventType.Progress, deltaProgress);
		if (nextProgress === 0 || nextProgress === 1) {
			this.triggerEvent(ScrollMagicEventType.Leave, deltaProgress);
		}
	}

	private updateViewportObserver(): void {
		const { scrollParent } = this.optionsPrivate;
		const observerOptions = {
			margin: this.getViewportMargin(),
			root: isWindow(scrollParent) ? null : scrollParent,
		};
		this.viewportObserver.modify(observerOptions);
	}

	private onOptionChanges(changes: Array<keyof Options.Private>) {
		const isChanged = changes.includes.bind(changes);
		const sizeChanged = isChanged('elementStart');
		const offsetChanged = isChanged('elementEnd');
		const elementChanged = isChanged('element');
		const scrollParentChanged = isChanged('scrollParent');

		if (sizeChanged || offsetChanged || elementChanged) {
			this.updateElementBoundsCache();
			if (elementChanged) {
				this.updateActive(undefined);
				const { element } = this.optionsPrivate;
				this.viewportObserver.disconnect();
				this.viewportObserver.observe(element);
				this.resizeObserver.disconnect();
				this.resizeObserver.observe(element);
			}
		}
		if (scrollParentChanged) {
			this.updateActive(undefined);
			this.container.attach(this.optionsPrivate.scrollParent, this.onContainerUpdate.bind(this)); // container updates are already throttled
		}
		// if the options change we always have to refresh the viewport observer, regardless which one it is...
		this.updateViewportObserver();
	}

	private onElementResize() {
		const { executionQueue, boundMethods, elementBoundsCache } = this;
		const { offsetStart: startPrevious, offsetEnd: endPrevious } = elementBoundsCache;
		executionQueue.schedule(boundMethods.updateTriggerBounds);
		executionQueue.schedule(
			boundMethods.updateViewportObserver,
			// compare to current values => only execute, if changed during scheduled update above
			() => startPrevious !== elementBoundsCache.offsetStart || endPrevious !== elementBoundsCache.offsetEnd
		);
		executionQueue.schedule(this.boundMethods.updateProgress);
	}

	private onContainerUpdate(e: ContainerEvent) {
		const { executionQueue, boundMethods } = this;
		if ('resize' === e.type) {
			executionQueue.schedule(boundMethods.updateViewportObserver);
		}
		executionQueue.schedule(boundMethods.updateProgress);
	}

	private onIntersectionChange(intersecting: boolean, target: Element) {
		// the check below should always be true, as we only ever observe one element, but you can never be too sure, I guess...
		if (target === this.optionsPrivate.element) {
			this.executionQueue.schedule(this.boundMethods.updateProgress);
			if (!intersecting) {
				// update immediately, if leaving and change active state after.
				this.executionQueue.moveUp();
			}
			this.updateActive(intersecting);
		}
	}

	// getter/setter public
	public set element(element: Options.Public['element']) {
		this.modify({ element });
	}
	public get element(): Options.Public['element'] {
		return this.optionsPublic.element;
	}
	public set scrollParent(scrollParent: Options.Public['scrollParent']) {
		this.modify({ scrollParent });
	}
	public get scrollParent(): Options.Public['scrollParent'] {
		return this.optionsPublic.scrollParent;
	}
	public set vertical(vertical: Options.Public['vertical']) {
		this.modify({ vertical });
	}
	public get vertical(): Options.Public['vertical'] {
		return this.optionsPublic.vertical;
	}
	public set triggerStart(triggerStart: Options.Public['triggerStart']) {
		this.modify({ triggerStart });
	}
	public get triggerStart(): Options.Public['triggerStart'] {
		return this.optionsPublic.triggerStart;
	}
	public set triggerEnd(triggerEnd: Options.Public['triggerEnd']) {
		this.modify({ triggerEnd });
	}
	public get triggerEnd(): Options.Public['triggerEnd'] {
		return this.optionsPublic.triggerEnd;
	}
	public set elementStart(elementStart: Options.Public['elementStart']) {
		this.modify({ elementStart });
	}
	public get elementStart(): Options.Public['elementStart'] {
		return this.optionsPublic.elementStart;
	}
	public set elementEnd(elementEnd: Options.Public['elementEnd']) {
		this.modify({ elementEnd });
	}
	public get elementEnd(): Options.Public['elementEnd'] {
		return this.optionsPublic.elementEnd;
	}

	// not an option -> getter only
	public get progress(): number {
		return this.currentProgress;
	}
	public get scrollOffset(): { start: number; end: number } {
		const { scrollParent, triggerStart, triggerEnd, vertical } = this.optionsPrivate;
		const { start: elementStart, offsetStart, offsetEnd, size: elementSize } = this.getElementBounds();
		const { clientSize: containerSize } = this.getContainerBounds();
		const { start: scrollOffset } = pickRelevantValues(vertical, getScrollPos(scrollParent));
		const elemOffset = elementStart + scrollOffset;
		return {
			start: Math.floor(elemOffset + offsetStart - triggerStart(containerSize)),
			end: Math.ceil(elemOffset + elementSize + offsetEnd - triggerEnd(containerSize)),
		};
	}
	public get computedOptions(): Options.PrivateComputed {
		return computeOptions(this.optionsPrivate);
	}

	// event listener
	public on(type: EventTypeEnumOrUnion, cb: (e: ScrollMagicEvent) => void): ScrollMagic {
		this.dispatcher.addEventListener(type as ScrollMagicEventType, cb);
		return this;
	}
	public off(type: EventTypeEnumOrUnion, cb: (e: ScrollMagicEvent) => void): ScrollMagic {
		this.dispatcher.removeEventListener(type as ScrollMagicEventType, cb);
		return this;
	}
	// same as on, but returns a function to reverse the effect (remove the listener).
	public subscribe(type: EventTypeEnumOrUnion, cb: (e: ScrollMagicEvent) => void): () => void {
		return this.dispatcher.addEventListener(type as ScrollMagicEventType, cb);
	}

	public destroy(): void {
		this.executionQueue.clear();
		this.resizeObserver.disconnect();
		this.viewportObserver.disconnect();
		this.container.detach();
	}

	// static options/methods

	private static defaultOptionsPublic = Options.defaults;
	// get or change default options
	public static default(options: Partial<Options.Public> = {}): Options.Public {
		this.defaultOptionsPublic = {
			...this.defaultOptionsPublic,
			...sanitizeOptions(options),
		};
		return this.defaultOptionsPublic;
	}
}
