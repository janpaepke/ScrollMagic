import { ContainerEvent } from './Container';
import { ContainerProxy } from './ContainerProxy';
import EventDispatcher from './EventDispatcher';
import { ThrottledExecutionQueue } from './ExecutionQueue';
import * as Options from './Options';
import ScrollMagicEvent, { ScrollMagicEventType } from './ScrollMagicEvent';
import getScrollPos from './util/getScrollPos';
import pickDifferencesFlat from './util/pickDifferencesFlat';
import { RectInfo, pickRelevantProps, pickRelevantValues } from './util/pickRelevantInfo';
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
		updateTriggerBounds: this.updateTriggerBounds.bind(this),
	} as const;

	// all below options should only ever be changed by a dedicated method
	// update function MUST NOT call any other functions, with the exceptions of modify
	private optionsPublic: Options.Public = ScrollMagic.defaultOptionsPublic;
	private optionsPrivate!: Options.Private; // set in modify in constructor
	private triggerBounds: { start: number; end: number; size: number } = {
		start: 0, // start relative to origin (= offset)
		end: 0, // end position relative to origin (= start offset + calculcated size)
		size: 0, // actual size of element
	};
	private currentProgress = 0;
	private active?: boolean; // scene active state

	// TODO: fix inverted scenes - they used to work...
	// TODO: consider what should happen to active state when parent or element are changed. Should leave / enter be dispatched?
	// TODO! BUGFIX scrolling too fast breaks it (use keyboard to go to top / bottom of page)
	// TODO: consider what should actually be private and what protected.
	// TODO: do we need to get a way to get the internal options?
	// todo: fix: horizontal scroll would trigger leave from viewport observer
	// TODO: Maybe only include internal errors for development? process.env...
	// TODO: check how often updateTriggerBounds is called
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
		// todo: wrong
		const inverse = this.triggerBounds.size < 0; // Houston, we may have an inverse scene on our hands...
		const forward = inverse ? deltaProgress < 0 : deltaProgress > 0;
		this.dispatcher.dispatchEvent(new ScrollMagicEvent(type, forward, this));
	}

	public modify(options: Partial<Options.Public>): ScrollMagic {
		const sanitized = Options.sanitize(options);
		const normalized = Options.transform(sanitized);
		const nextPrivate = Options.infer({ ...this.optionsPrivate, ...normalized });

		this.optionsPublic = { ...this.optionsPublic, ...sanitized };

		const changed = isUndefined(this.optionsPrivate) // internal options not set on first run, so all changed
			? nextPrivate
			: pickDifferencesFlat(nextPrivate, this.optionsPrivate);
		const changedOptions = Object.keys(changed) as Array<keyof Options.Private>;

		if (changedOptions.length === 0) {
			return this;
		}

		this.optionsPrivate = nextPrivate;

		this.onOptionChanges(changedOptions);
		return this;
	}

	private getViewportMargin() {
		const { trackEnd, trackStart } = this.optionsPrivate;
		const { start: startProp, end: endProp } = this.getRelevantProps();
		const { size: containerSize } = this.getRelevantValues(this.container.rect);

		const trackStartMargin = trackStart - 1; // distance from bottom
		const trackEndMargin = -trackEnd; // distance from top

		const { start, end, size } = this.triggerBounds;
		const relStartOffset = start / containerSize;
		const relEndOffset = (end - size) / containerSize;

		// the start and end values are intentionally flipped here (start value defines end margin and vice versa)
		const reset = { top: '0px', right: '0px', bottom: '0px', left: '0px' };
		return {
			...reset,
			[endProp]: numberToPercString(trackStartMargin - relStartOffset),
			[startProp]: numberToPercString(trackEndMargin + relEndOffset),
		};
	}

	private getRelevantProps() {
		return pickRelevantProps(this.optionsPrivate.vertical);
	}

	private getRelevantValues<T extends Partial<RectInfo>>(rect: T) {
		return pickRelevantValues(this.optionsPrivate.vertical, rect);
	}

	private updateActive(nextActive: boolean | undefined) {
		// doesn't have to be a method, but I want to keep modifications obvious (only called from update... methods)
		this.active = nextActive;
	}

	private updateTriggerBounds() {
		// check variable initialisation for property description
		const { offset, size, element } = this.optionsPrivate;
		const { size: elementSize } = this.getRelevantValues(element.getBoundingClientRect());
		const start = offset(elementSize);
		const end = size(elementSize) + start;
		this.triggerBounds = { start, end, size: elementSize };
	}

	private updateProgress() {
		if (this.active === false) {
			return 0;
		}

		const { trackEnd, trackStart, element } = this.optionsPrivate;
		const { start: elementPosition } = this.getRelevantValues(element.getBoundingClientRect());
		const { start: elementStart, end: elementEnd } = this.triggerBounds;
		const { size: containerSize } = this.getRelevantValues(this.container.rect);

		const relativeStart = (elementPosition + elementStart) / containerSize;
		const relativeDistance = (elementEnd - elementStart) / containerSize;
		const trackDistance = trackStart - trackEnd;

		const passed = trackStart - relativeStart;
		const total = relativeDistance + trackDistance;
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
		const sizeChanged = isChanged('size');
		const offsetChanged = isChanged('offset');
		const elementChanged = isChanged('element');
		const scrollParentChanged = isChanged('scrollParent');

		if (sizeChanged || offsetChanged || elementChanged) {
			this.updateTriggerBounds();
			if (elementChanged) {
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
		const { executionQueue, boundMethods, triggerBounds } = this;
		const { start: startPrevious, end: endPrevious } = triggerBounds;
		executionQueue.schedule(boundMethods.updateTriggerBounds);
		executionQueue.schedule(
			boundMethods.updateViewportObserver,
			() => startPrevious !== triggerBounds.start || endPrevious !== triggerBounds.end // compare to current values => only execute, if changed
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
			this.executionQueue.moveUp();
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
	public set trackStart(trackStart: Options.Public['trackStart']) {
		this.modify({ trackStart });
	}
	public get trackStart(): Options.Public['trackStart'] {
		return this.optionsPublic.trackStart;
	}
	public set trackEnd(trackEnd: Options.Public['trackEnd']) {
		this.modify({ trackEnd });
	}
	public get trackEnd(): Options.Public['trackEnd'] {
		return this.optionsPublic.trackEnd;
	}
	public set offset(offset: Options.Public['offset']) {
		this.modify({ offset });
	}
	public get offset(): Options.Public['offset'] {
		return this.optionsPublic.offset;
	}
	public set size(size: Options.Public['size']) {
		this.modify({ size });
	}
	public get size(): Options.Public['offset'] {
		return this.optionsPublic.offset;
	}

	// not an option -> getter only
	public get progress(): number {
		return this.currentProgress;
	}
	public get scrollOffset(): { start: number; end: number } {
		const { element, scrollParent, trackStart, trackEnd } = this.optionsPrivate;
		const { start: elementStart } = this.getRelevantValues(element.getBoundingClientRect());
		const { start: elementOffsetStart, end: elementOffsetEnd } = this.triggerBounds;
		const { start: parentOffset } = this.getRelevantValues(getScrollPos(scrollParent));
		const { size: containerSize } = this.getRelevantValues(this.container.rect);
		const elemOffset = elementStart + parentOffset;
		const trackOffsetStart = containerSize * trackStart;
		const trackOffsetEnd = containerSize * trackEnd;
		return {
			start: Math.floor(elemOffset + elementOffsetStart - trackOffsetStart),
			end: Math.ceil(elemOffset + elementOffsetEnd - trackOffsetEnd),
		};
	}
	public get computedOptions(): Options.Private {
		return { ...this.optionsPrivate };
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
		const sanitized = Options.sanitize(options);
		Options.transform(sanitized); // run to check for errors, but ignore result
		this.defaultOptionsPublic = {
			...this.defaultOptionsPublic,
			...sanitized,
		};
		return this.defaultOptionsPublic;
	}
}
