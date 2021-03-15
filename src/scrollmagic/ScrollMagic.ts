import { ContainerEvent } from './Container';
import { ContainerProxy } from './ContainerProxy';
import EventDispatcher from './EventDispatcher';
import * as Options from './Options';
import { warn } from './ScrollMagicError';
import ScrollMagicEvent, { ScrollMagicEventType } from './ScrollMagicEvent';
import { batch } from './util/batch';
import pickDifferencesFlat from './util/pickDifferencesFlat';
import { RectInfo, pickRelevantProps, pickRelevantValues } from './util/pickRelevantInfo';
import throttleRaf from './util/throttleRaf';
import { numberToPercString, stringPropertiesToNumber } from './util/transformers';
import { isUndefined, isWindow } from './util/typeguards';
import ViewportObserver, { defaultViewportObserverMargin } from './ViewportObserver';

export { Public as ScrollMagicOptions } from './Options';

// used for listeners to allow the value to be passed in either from the enum or as a string literal
type EventTypeEnumOrUnion = ScrollMagicEventType | `${ScrollMagicEventType}`;
export class ScrollMagic {
	public readonly name = 'ScrollMagic';

	private dispatcher = new EventDispatcher();
	private container = new ContainerProxy(this);
	private resizeObserver = new ResizeObserver(throttleRaf(this.onElementResize.bind(this)));
	private viewportObserver = new ViewportObserver(throttleRaf(this.onIntersectionChange.bind(this)));

	// all below options should only ever be changed by a dedicated method
	// update function MUST NOT call any other functions, with the exceptions of modify
	private optionsPublic: Options.Public = ScrollMagic.defaultOptionsPublic;
	private optionsPrivate!: Options.Private; // set in modify in constructor
	private triggerBounds: { start: number; end: number; size: number } = {
		start: 0,
		end: 0,
		size: 0,
	}; // start and end positions (relative to element origin) and end offset
	private currentProgress = 0;
	private active?: boolean; // scene active state

	// TODO: fix event triggers outside of viewport (enter / leave should still trigger even without progress updates)
	// TODO: implement 'infer' option for trackStart and trackEnd
	// TODO: fix inverted scenes - they used to work...
	// TODO: consider what should happen to active state when parent or element are changed. Should leave / enter be dispatched?
	// TODO! BUGFIX enter and leave don't dispatch when leaving scene on resize

	// TODO: ViewportObserver: only set up IntersectionObservers, once .observe is called
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
		const inverse = this.triggerBounds.size < 0; // Houston, we may have an inverse scene on our hands...
		const forward = inverse ? deltaProgress < 0 : deltaProgress > 0;
		this.dispatcher.dispatchEvent(new ScrollMagicEvent(type, forward, this));
	}

	public modify(options: Partial<Options.Public>): ScrollMagic {
		const normalized = batch(Options.sanitize, Options.process)(options);

		this.optionsPublic = {
			...this.optionsPublic,
			...options,
		};

		const changed = isUndefined(this.optionsPrivate) // internal options not set on first run, so all changed
			? normalized
			: pickDifferencesFlat(normalized, this.optionsPrivate);
		const changedOptions = Object.keys(changed) as Array<keyof Options.Private>;

		if (changedOptions.length === 0) {
			return this;
		}

		this.optionsPrivate = {
			...this.optionsPrivate,
			...normalized,
		};

		this.onOptionChanges(changedOptions);
		return this;
	}

	// this function checks if options make sense as a whole
	private checkOptionsInterdependence() {
		// test if the margin for ViewportObserver would result in positive values,
		// which would put the triggerpoint outside of the viewport.
		// This breaks, because IntersectionObserver only works within the viewport.
		const margin = stringPropertiesToNumber(this.getViewportMargin()); // Watch out these are % values => 100%
		const { start: marginStart, end: marginEnd } = this.getRelevantValues(margin);
		const { size: containerSize } = this.getRelevantValues(this.container.rect);
		const { size } = this.triggerBounds;
		const relSize = size / containerSize;
		const invalid = (what: string) =>
			warn(
				`With the current configuration the trigger element ${
					this.optionsPublic.element
				} will be outside of the viewport when it touches the ${what} position. Unless something changes, the ${what} progress might never reach ${
					what === 'start' ? 0 : 1
				}`
			);
		// check `getViewportMargin`, if you're wondering why this appears to be flipped.
		if (marginStart - relSize * 100 > 0) {
			invalid('end');
		}
		if (marginEnd > 0) {
			invalid('start');
		}
		// TODO: check again if this makes sense - maybe they would just be inverse?
		// const { trackStart, trackEnd } = this.optionsPrivate;
		// if (trackEnd - trackStart > relEnd) {
		// 	warn(
		// 		`There is currently no overlap between your track and your element, which is likely unintentional. Did you mean to swap trackStart and trackEnd?`
		// 	);
		// }
	}

	private getViewportMargin() {
		const { trackEnd, trackStart } = this.optionsPrivate;
		const { start: startProp, end: endProp } = this.getRelevantProps();
		const { size: containerSize } = this.getRelevantValues(this.container.rect);

		const trackStartMargin = trackStart - 1; // distance from bottom
		const trackEndMargin = -trackEnd; // distance from top

		const { start, end, size } = this.triggerBounds;
		const relStart = start / containerSize;
		const relEnd = (end - size) / containerSize;

		// the start and end values are intentionally flipped here (start value defines end margin and vice versa)
		return {
			...defaultViewportObserverMargin,
			[endProp]: numberToPercString(trackStartMargin - relStart),
			[startProp]: numberToPercString(trackEndMargin + relEnd),
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
		const { offset, size, element } = this.optionsPrivate;
		const { size: elementSize } = this.getRelevantValues(element.getBoundingClientRect());
		const pxSize = size(elementSize);
		const start = offset(elementSize);
		const end = start + pxSize;
		this.triggerBounds = { start, end, size: pxSize };
	}

	private updateProgress(intersectionState?: boolean) {
		if (isUndefined(intersectionState) && !this.active) {
			return 0;
		}

		const { trackEnd, trackStart, element } = this.optionsPrivate;
		const { start: elementStart } = this.getRelevantValues(element.getBoundingClientRect());
		const { size: containerSize } = this.getRelevantValues(this.container.rect);

		const { start, size } = this.triggerBounds;
		const relativeSize = size / containerSize;
		const relativeStart = (start + elementStart) / containerSize;
		const trackDistance = trackStart - trackEnd;

		const passed = trackStart - relativeStart;
		const total = relativeSize + trackDistance;
		const nextProgress = Math.min(Math.max(passed / total, 0), 1); // when leaving, it will overshoot, this normalises to 0 / 1
		const deltaProgress = nextProgress - this.currentProgress;
		this.currentProgress = nextProgress;

		const skipped = deltaProgress === 1;
		if (true === intersectionState || skipped) {
			this.triggerEvent(ScrollMagicEventType.Enter, deltaProgress);
		}
		this.triggerEvent(ScrollMagicEventType.Progress, deltaProgress);
		if (false === intersectionState || nextProgress === 1 || nextProgress === 0) {
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
			this.container.attach(this.optionsPrivate.scrollParent, throttleRaf(this.onContainerUpdate.bind(this)));
		}
		// one last check, before we go.
		this.checkOptionsInterdependence();
		// if the options change we always have to refresh the viewport observer, regardless which one it is...
		this.updateViewportObserver();
	}

	private onElementResize() {
		const { start: startPrevious, end: endPrevious } = this.triggerBounds;
		this.updateTriggerBounds();
		const { start, end } = this.triggerBounds;
		if (startPrevious !== start || endPrevious !== end) {
			this.updateViewportObserver();
		}
		this.updateProgress();
	}

	private onContainerUpdate(e: ContainerEvent) {
		if ('resize' === e.type) {
			this.updateViewportObserver();
		}
		this.updateProgress();
	}

	private onIntersectionChange(intersecting: boolean, target: Element) {
		// the check below should always be true, as we only ever observe one element, but you can never be too sure, I guess...
		if (target === this.optionsPrivate.element) {
			this.updateActive(intersecting);
			this.updateProgress(intersecting);
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
		this.resizeObserver.disconnect();
		this.viewportObserver.disconnect();
		this.container.detach();
	}

	// static options/methods

	private static defaultOptionsPublic = Options.defaults;
	// get or change default options
	public static default(options: Partial<Options.Public> = {}): Options.Public {
		const sanitized = Options.sanitize(options);
		Options.process(sanitized); // run to check for errors, but ignore result
		this.defaultOptionsPublic = {
			...this.defaultOptionsPublic,
			...sanitized,
		};
		return this.defaultOptionsPublic;
	}
}
