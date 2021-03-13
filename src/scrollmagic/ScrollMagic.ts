import { ContainerEvent } from './Container';
import { ContainerProxy } from './ContainerProxy';
import EventDispatcher from './EventDispatcher';
import * as Options from './Options';
import ScrollMagicEvent, { ScrollMagicEventType } from './ScrollMagicEvent';
import { getPixelDistance as getPixelValue } from './util/getRelativeDistance';
import pickDifferencesFlat from './util/pickDifferencesFlat';
import { pickRelevantProps, pickRelevantValues } from './util/pickRelevantInfo';
import throttleRaf from './util/throttleRaf';
import { numberToPercString } from './util/transformers';
import { isWindow } from './util/typeguards';
import validateObject from './util/validateObject';
import ViewportObserver, { defaultViewportObserverMargin } from './ViewportObserver';

export { Public as ScrollMagicOptions } from './Options';

// used for listeners to allow the value to be passed in either from the enum or as a string literal
type EventTypeEnumOrUnion = ScrollMagicEventType | `${ScrollMagicEventType}`;
export class ScrollMagic {
	public readonly name = 'ScrollMagic';

	private dispatcher = new EventDispatcher();
	private container = new ContainerProxy(this);
	private resizeObserver = new ResizeObserver(throttleRaf(this.onElementResize.bind(this)));

	// all below options should only ever be changed by a dedicated method
	// update function MUST NOT call any other functions, with the exceptions of modify
	private optionsPublic: Options.Public = ScrollMagic.defaultOptionsPublic;
	private optionsPrivate!: Options.Private; // set in modify in constructor
	private viewportObserver?: ViewportObserver;
	private elementSize?: number; // cached element height (only updated if height != 100%)
	private active?: boolean; // scene active state
	private currentProgress = 0;
	private isNaturalIntersection = true;

	// TODO: currently options.element isn't really optional. Can we make it?
	constructor(options: Partial<Options.Public> = {}) {
		const initOptions: Options.Public = {
			...ScrollMagic.defaultOptionsPublic,
			...options,
		};
		this.modify(initOptions);
	}

	public modify(options: Partial<Options.Public>): ScrollMagic {
		const normalized = validateObject(options, Options.validationRules);

		this.optionsPublic = {
			...this.optionsPublic,
			...options,
		};

		const changed =
			undefined === this.optionsPrivate // internal options not set on first run, so all changed
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

	private getViewportMargin() {
		// todo: memoize all or part of this? Might not be worth it...
		const { vertical, trackEnd, trackStart, offset, height } = this.optionsPrivate;
		const { start, end } = pickRelevantProps(vertical);
		const { size: containerSize } = pickRelevantValues(vertical, this.container.size);

		const trackStartMargin = trackStart - 1; // distance from bottom
		const trackEndMargin = -trackEnd; // distance from top

		// TODO: ask Pimm if this IIFE should get params or is ok to use parent values
		const [startOffset, endOffset] = (() => {
			if (this.isNaturalIntersection) {
				// if startOffset is 0 and height is 100% we can take a little shortcut here.
				return [0, 0];
			}
			if (undefined === this.elementSize) {
				// should never be the case, but why not...
				this.updateElementSize();
			}
			const startOffset = getPixelValue(offset, this.elementSize!) / containerSize;
			const relativeHeight = getPixelValue(height, this.elementSize!) / containerSize;
			const endOffset = relativeHeight - this.elementSize! / containerSize; // deduct elem height to correct for the fact that trackEnd cares for the end of the element
			return [startOffset, endOffset];
		})();

		// the start and end values are intentionally flipped here (start value defines end margin and vice versa)
		return {
			...defaultViewportObserverMargin,
			[end]: numberToPercString(trackStartMargin - startOffset),
			[start]: numberToPercString(trackEndMargin + startOffset + endOffset),
		};
	}

	private updateActive(nextActive: boolean | undefined) {
		// doesn't have to be a method, but I want to keep modifications obvious (only called from update... methods)
		this.active = nextActive;
	}

	private updateNaturalIntersection() {
		// if there is no offset from the top and bottom of the element (default)
		// this allows for simpler calculations and less refreshes.
		const { offset, height } = this.optionsPrivate;
		const [offsetValue] = offset;
		const [heightValue, heightUnit] = height;
		this.isNaturalIntersection = offsetValue === 0 && heightValue === 1 && heightUnit === '%';
	}

	private updateElementSize() {
		if (this.isNaturalIntersection) {
			return;
		}
		const { vertical, element } = this.optionsPrivate;
		const { size: nextSize } = pickRelevantValues(vertical, element.getBoundingClientRect());
		this.elementSize = nextSize;
	}

	private updateProgress(force = false) {
		if (!force && !this.active) {
			return;
		}
		const { vertical, trackEnd, trackStart, offset, element, height } = this.optionsPrivate;
		const { size: elemSize, start: elemStart } = pickRelevantValues(vertical, element.getBoundingClientRect()); //don't use cached value here, we need the current position
		const { size: containerSize } = pickRelevantValues(vertical, this.container.size);

		const startOffset = getPixelValue(offset, elemSize) / containerSize;
		const relativeHeight = getPixelValue(height, elemSize) / containerSize;
		const relativeStart = startOffset + elemStart / containerSize;
		const trackDistance = trackStart - trackEnd;

		const passed = trackStart - relativeStart;
		const total = relativeHeight + trackDistance;

		const nextProgress = Math.min(Math.max(passed / total, 0), 1); // when leaving, it will overshoot, this normalises to 0 / 1
		if (nextProgress !== this.currentProgress) {
			const forward = nextProgress > this.progress;

			if ((nextProgress > 0 && this.currentProgress === 0) || (nextProgress < 1 && this.currentProgress === 1)) {
				this.dispatcher.dispatchEvent(new ScrollMagicEvent(ScrollMagicEventType.Enter, forward, this));
			}

			this.currentProgress = nextProgress;
			this.dispatcher.dispatchEvent(new ScrollMagicEvent(ScrollMagicEventType.Progress, forward, this));

			if (nextProgress === 0 || nextProgress === 1) {
				this.dispatcher.dispatchEvent(new ScrollMagicEvent(ScrollMagicEventType.Leave, forward, this));
			}
		}
	}

	private updateViewportObserver(): void {
		const { scrollParent, element } = this.optionsPrivate;
		const observerOptions = {
			margin: this.getViewportMargin(),
			root: isWindow(scrollParent) ? null : scrollParent,
		};

		if (undefined === this.viewportObserver) {
			this.viewportObserver = new ViewportObserver(this.onIntersect.bind(this), observerOptions).observe(element);
		} else {
			this.viewportObserver.modify(observerOptions);
		}
	}

	private onOptionChanges(changes: Array<keyof Options.Private>) {
		// TODO: consider what should happen to active state when parent or element are changed. Should leave / enter be dispatched?

		const isChanged = changes.includes.bind(changes);
		const heightChanged = isChanged('height');
		const offsetChanged = isChanged('offset');
		const elementChanged = isChanged('element');
		const scrollParentChanged = isChanged('scrollParent');

		// TODO: can this be written better?
		if (heightChanged || offsetChanged || elementChanged) {
			this.updateNaturalIntersection();
			if (heightChanged || elementChanged) {
				this.updateElementSize();
			}
			if (elementChanged) {
				this.resizeObserver.disconnect();
				this.resizeObserver.observe(this.optionsPrivate.element);
			}
		}
		if (scrollParentChanged) {
			this.updateActive(undefined);
			this.container.attach(this.optionsPrivate.scrollParent, this.onContainerResize.bind(this));
		}
		// if the options change we always have to refresh the viewport observer, regardless which one it is...
		this.updateViewportObserver();
	}

	private onElementResize() {
		const currentSize = this.elementSize;
		this.updateElementSize();
		const sizeChanged = currentSize !== this.elementSize;
		if (sizeChanged && !this.isNaturalIntersection) {
			this.updateViewportObserver();
		}
		this.updateProgress();
	}

	private onContainerResize(e: ContainerEvent) {
		if ('resize' === e.type) {
			this.updateViewportObserver();
		}
		this.updateProgress();
	}

	private onIntersect(intersecting: boolean, target: Element) {
		// the check below should always be true, as we only ever observe one element, but you can never be too sure, I guess...
		if (target === this.optionsPrivate.element) {
			// for the first call (active === undefined) we need to update the progress,
			// regardless if scene is now active or not (i.e. if the page loads when the scene was passed)
			const initialCall = undefined === this.active;
			this.updateActive(intersecting);
			this.updateProgress(initialCall);
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
		this.viewportObserver?.disconnect();
		this.container.detach();
	}

	// static options/methods

	private static defaultOptionsPublic = Options.defaults;
	// get or change default options
	public static default(options: Partial<Options.Public> = {}): Options.Public {
		validateObject(options, Options.validationRules);
		this.defaultOptionsPublic = {
			...this.defaultOptionsPublic,
			...options,
		};
		return this.defaultOptionsPublic;
	}
}
