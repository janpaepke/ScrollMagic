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
export class Scene {
	public readonly name = 'ScrollMagic';

	private static defaultOptionsPublic = Options.defaults;

	private dispatcher = new EventDispatcher();
	private container = new ContainerProxy(this);
	private resizeObserver = new ResizeObserver(throttleRaf(() => this.updateElementSizeCache()));
	private viewportObserver?: ViewportObserver;

	private optionsPublic: Options.Public = Scene.defaultOptionsPublic;
	private optionsPrivate!: Options.Private; // set in modify in constructor
	// TODO: only cache size
	private elementSize?: number; // cached element height
	private active?: boolean; // scene active state
	private currentProgress = 0;
	private isNaturalIntersection = true;

	// TODO: currently options.element isn't optional. Can we make it?
	constructor(options: Partial<Options.Public> = {}) {
		const initOptions: Options.Public = {
			...Scene.defaultOptionsPublic,
			...options,
		};
		this.modify(initOptions);
		// TODO: resize observer for element and container
	}

	public modify(options: Partial<Options.Public>): Scene {
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

		// TODO: consider what should happen to active state when parent or element are changed. Should leave / enter be dispatched?

		// todo: make this a private method.
		const isChanged = changedOptions.includes;
		const heightChanged = isChanged('height');
		const offsetChanged = isChanged('offset');
		const elementChanged = isChanged('element');
		const scrollParentChanged = isChanged('scrollParent');
		if (heightChanged || offsetChanged) {
			// if there is no offset from the top and bottom of the element (default)
			// this allows for simpler calculations and less refreshes.
			const { offset, height } = this.optionsPrivate;
			const [offsetValue] = offset;
			const [heightValue, heightUnit] = height;
			this.isNaturalIntersection = offsetValue === 0 && heightValue === 1 && heightUnit === '%';
			if (heightChanged) {
				this.updateElementSizeCache();
			}
		}
		if (elementChanged) {
			this.resizeObserver.disconnect();
			this.updateElementSizeCache();
			this.resizeObserver.observe(this.optionsPrivate.element);
		}
		if (scrollParentChanged) {
			this.container.attach(this.optionsPrivate.scrollParent, e => {
				if ('resize' === e.type) {
					this.updateViewportObserver();
				}
				this.updateProgress(true);
			});
		}

		// if the options change we always have to refresh the viewport observer, regardless which one it is...
		this.updateViewportObserver();
		return this;
	}

	private setActive(nextActiveState: boolean) {
		if (nextActiveState === this.active) {
			return; // boring.
		}
		const isInitialLeave = undefined === this.active && !nextActiveState; // for the initial set to false there's no need to do anything
		this.active = nextActiveState;
		if (isInitialLeave) {
			return;
		}
		const type = this.active ? ScrollMagicEventType.Enter : ScrollMagicEventType.Leave;
		const forward = (this.progress !== 1 && this.active) || (this.progress !== 0 && !this.active);
		this.dispatcher.dispatchEvent(new ScrollMagicEvent(type, forward, this));
		this.updateProgress();
	}

	private updateElementSizeCache(force = true) {
		if (!force && this.isNaturalIntersection) {
			return;
		}
		const { vertical, element } = this.optionsPrivate;
		const currentRect = element.getBoundingClientRect();
		const { size: nextSize } = pickRelevantValues(vertical, currentRect);
		const sizeChanged = this.elementSize === nextSize;
		this.elementSize = nextSize;
		const currentActive = this.active;
		if (sizeChanged && !this.isNaturalIntersection) {
			this.updateViewportObserver();
		}
		if (this.active && currentActive === this.active) {
			// if we were in the scene before and are now, we need to update the progress
			this.updateProgress();
		}
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

		const progress = Math.min(Math.max(passed / total, 0), 1); // when leaving, it will overshoot, this normalises to 0 / 1
		if (progress !== this.currentProgress) {
			const forward = progress > this.progress;
			this.currentProgress = progress;
			this.dispatcher.dispatchEvent(new ScrollMagicEvent(ScrollMagicEventType.Progress, forward, this));
		}
	}

	private calculateMargin() {
		// todo: memoize all or part of this? Might not be worth it...
		const { vertical, trackEnd, trackStart, offset, height, element } = this.optionsPrivate;
		const { start, end } = pickRelevantProps(vertical);
		if (undefined === this.elementSize) {
			const { size: freshElementSize } = pickRelevantValues(vertical, element.getBoundingClientRect());
			this.elementSize = freshElementSize;
		}
		const elemSize = this.elementSize;
		const { size: containerSize } = pickRelevantValues(vertical, this.container.size);

		const trackStartMargin = trackStart - 1; // distance from bottom
		const trackEndMargin = -trackEnd; // distance from top

		const startOffset = getPixelValue(offset, elemSize) / containerSize;
		const relativeHeight = getPixelValue(height, elemSize) / containerSize; // if startOffset is 0 and height is 100% we COULD take a little shortcut (endoffset = 0), but I doubt it's worth the code.
		const endOffset = relativeHeight - elemSize / containerSize; // deduct elem height to correct for the fact that trackEnd cares for the end of the element

		// the start and end values are intentionally flipped here (start value defines end margin and vice versa)
		return {
			...defaultViewportObserverMargin,
			[end]: numberToPercString(trackStartMargin - startOffset),
			[start]: numberToPercString(trackEndMargin + startOffset + endOffset),
		};
	}

	private updateViewportObserver(): void {
		const { scrollParent } = this.optionsPrivate;
		const observerOptions = {
			margin: this.calculateMargin(),
			root: isWindow(scrollParent) ? null : scrollParent,
		};

		if (undefined === this.viewportObserver) {
			this.viewportObserver = new ViewportObserver((intersecting, target) => {
				if (target === this.optionsPrivate.element) {
					// this should always be the case, as we only ever observe one element, but you can never be too sure, I guess...
					this.setActive(intersecting);
				}
			}, observerOptions).observe(this.optionsPrivate.element);
		} else {
			this.viewportObserver.updateOptions(observerOptions);
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
	public static default(options: Partial<Options.Public> = {}): Options.Public {
		validateObject(options, Options.validationRules);
		this.defaultOptionsPublic = {
			...this.defaultOptionsPublic,
			...options,
		};
		return this.defaultOptionsPublic;
	}

	// event listener
	public on(type: EventTypeEnumOrUnion, cb: (e: ScrollMagicEvent) => void): Scene {
		this.dispatcher.addEventListener(type as ScrollMagicEventType, cb);
		return this;
	}
	public off(type: EventTypeEnumOrUnion, cb: (e: ScrollMagicEvent) => void): Scene {
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
}
