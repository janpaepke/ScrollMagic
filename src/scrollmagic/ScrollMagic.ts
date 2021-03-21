import { ContainerEvent } from './Container';
import { ContainerProxy } from './ContainerProxy';
import EventDispatcher from './EventDispatcher';
import { ExecutionQueue } from './ExecutionQueue';
import * as Options from './Options';
import {
	compute as computeOptions,
	process as processOptions,
	sanitize as sanitizeOptions,
} from './Options.processors';
import ScrollMagicEvent, { ScrollMagicEventType } from './ScrollMagicEvent';
import debounce from './util/debounce';
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
type ElementBounds = {
	start: number; //		position relative to viewport
	offsetStart: number; // offset relative to top/left of element
	offsetEnd: number; // 	offset relative to bottom/right of element
	size: number; // 		actual size of element
	trackSize: number; // 	total size including offsets
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
		viewportObserver: this.updateViewportObserver.bind(this),
		progress: this.updateProgress.bind(this),
	});
	private readonly update = this.executionQueue.commands; // not sure this is good style, but I kind of don't want to write this.executionQueue.commands every time...
	private readonly debouncedOnFastScrollDetected = debounce(this.onFastScrollDetected.bind(this), 100); // why 100? because.

	// all below options should only ever be changed by a dedicated method
	// update function MUST NOT call any other functions, with the exceptions of modify
	private optionsPublic: Options.Public = ScrollMagic.defaultOptionsPublic;
	private optionsPrivate!: Options.Private; // set in modify in constructor
	private elementBoundsCache: ElementBounds = {
		// see typedef for details
		start: 0,
		offsetStart: 0,
		offsetEnd: 0,
		size: 0,
		trackSize: 0,
	};
	private currentProgress = 0;
	private intersecting?: boolean; // is the scene currently intersecting with the ViewportObserver?

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
		this.dispatcher.dispatchEvent(new ScrollMagicEvent(this, type, deltaProgress > 0));
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

	private getElementBounds(): ElementBounds {
		// this should be called cautiously, getBoundingClientRect costs...
		// check variable initialisation for property description
		const { elementStart, elementEnd, element, vertical } = this.optionsPrivate;
		const { start, size: elementSize } = pickRelevantValues(vertical, element.getBoundingClientRect());
		const offsetStart = elementStart(elementSize);
		const offsetEnd = elementEnd(elementSize);
		return {
			start,
			offsetStart,
			offsetEnd,
			size: elementSize,
			trackSize: elementSize - offsetStart - offsetEnd,
		};
	}

	private getContainerBounds(forceDirection?: boolean) {
		return pickRelevantValues(forceDirection ?? this.optionsPrivate.vertical, this.container.rect); // these are already cached. fine to call as often as we like
	}

	private updateIntersecting(nextIntersecting: boolean | undefined) {
		// doesn't have to be a method, but I want to keep modifications obvious (only called from update... methods)
		this.intersecting = nextIntersecting;
	}

	private updateElementBoundsCache() {
		// console.log(this.optionsPrivate.element.id, 'bounds', new Date().getMilliseconds());
		this.elementBoundsCache = this.getElementBounds();
	}

	private updateProgress() {
		// console.log(this.optionsPrivate.element.id, 'progress', new Date().getMilliseconds());
		const { triggerStart, triggerEnd } = this.optionsPrivate;
		const { offsetStart, trackSize: elementDistance, start: elementPosition } = this.elementBoundsCache;
		const { clientSize: containerSize } = this.getContainerBounds();

		const containerOffsetStart = triggerStart(containerSize);
		const containerOffsetEnd = triggerEnd(containerSize);
		const start = elementPosition + offsetStart;
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
			this.update.elementBounds.schedule();
			if (elementChanged) {
				this.updateIntersecting(undefined);
				const { element } = this.optionsPrivate;
				this.viewportObserver.disconnect();
				this.viewportObserver.observe(element);
				this.resizeObserver.disconnect();
				this.resizeObserver.observe(element);
			}
		}
		if (scrollParentChanged) {
			this.updateIntersecting(undefined);
			this.container.attach(this.optionsPrivate.scrollParent, this.onContainerUpdate.bind(this)); // container updates are already throttled
		}
		// if the options change we always have to refresh the viewport observer, regardless which one it is...
		this.update.viewportObserver.schedule();
	}

	private onElementResize() {
		/**
		 * * element resized
		 * updateElementBounds => schedule always (obviously),	execute regardless.
		 * updateViewportObserver => schedule always, 			execute if start or end offset changed in trigger bounds update above
		 * updateProgress => schedule if currently intersecting,		execute if start or end offset changed in trigger bounds update above
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

	private onContainerUpdate(e: ContainerEvent) {
		/**
		 * * container resized
		 * updateElementBounds => 		schedule if currently intersecting, 	execute regardless (resizes are caught in onElementResize but position might change due to container resize, which wouldn't be)
		 * updateViewportObserver => 	schedule always (to get new margins),	execute regardless.
		 * updateProgress => 			schedule if currently intersecting, 	execute if position changed in triggerBounds update
		 */
		const { update, intersecting } = this;
		if ('resize' === e.type) {
			if (intersecting) {
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
		 * updateElementBounds =>		schedule if currently intersecting,		execute regardless
		 * updateViewportObserver => 	never
		 * updateProgress =>			schedule if currently intersecting, 	execute regardless (technically only execute if triggerBounds returned a new position, but that's implied, if there was a scoll move in the relevant direction)
		 */
		const { scrollDelta } = pickRelevantValues(this.optionsPrivate.vertical, e.scrollDelta);
		// TODO! fix fast scroll detection - currently only element track is used, but viewport track should be added
		if (!this.intersecting && Math.abs(scrollDelta) > Math.abs(this.elementBoundsCache.trackSize)) {
			// in case the scroll position changes by more than the track distance, the viewport observer might miss it.
			// this can trigger multiple times, if the user jumps from page top to bottom, so we need to debounce it.
			this.debouncedOnFastScrollDetected();
		}
		if (0 === scrollDelta || !this.intersecting) {
			return;
		}
		update.elementBounds.schedule();
		update.progress.schedule();
	}

	private onIntersectionChange(intersecting: boolean, target: Element) {
		/**
		 * * intersection state changed
		 * updateElementBounds =>		never (would be caught by onElementResize or onContainerUpdate)
		 * updateViewportObserver =>	never
		 * updateProgress =>			schedule regardless, execute regardless
		 */
		// the check below should always be true, as we only ever observe one element, but you can never be too sure, I guess...
		if (target === this.optionsPrivate.element) {
			this.updateIntersecting(intersecting);
			this.update.progress.schedule();
		}
	}

	private onFastScrollDetected() {
		/**
		 * * fast scroll detected
		 * * this means the ViewportObserver might "miss", that we passed the scene
		 * updateElementBounds => schedule regardless, execute regardless
		 * updateViewportObserver => never
		 * updateProgress => schedule regardless, execute regardless
		 */
		// console.log('fastScroll!');
		this.update.elementBounds.schedule();
		this.update.progress.schedule();
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
		const { start: elementPosition, offsetStart, trackSize } = this.getElementBounds(); // it's ok here to not use cached values
		const { clientSize: containerSize } = this.getContainerBounds();
		const { start: scrollOffset } = pickRelevantValues(vertical, getScrollPos(scrollParent));

		const absolutePosition = elementPosition + scrollOffset;
		const start = absolutePosition + offsetStart;
		const end = start + trackSize;
		return {
			start: Math.floor(start - triggerStart(containerSize)),
			end: Math.ceil(end - containerSize + triggerEnd(containerSize)),
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
		this.executionQueue.cancel();
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
