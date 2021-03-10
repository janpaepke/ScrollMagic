import { ContainerManager } from './ContainerManager';
import EventDispatcher, {
	Callback,
	NarrowDownEvent,
	ScrollMagicEvent,
	ScrollMagicEventType,
	ScrollMagicProgressEvent,
} from './EventDispatcher';
import getElement from './util/getElement';
import getScrollContainerElement from './util/getScrollContainerElement';
import { isWindow } from './util/typeguards';
import ViewportObserver from './ViewportObserver';

export interface ScrollMagicOptions {
	element: HTMLElement | string; // TODO: can we make it optional?
	scrollParent?: Window | Document | HTMLElement | string;
	vertical?: boolean;
	trackStart?: number;
	trackEnd?: number;
	offset?: number | string;
}

export class Scene {
	public name = 'ScrollMagic';
	private dispatcher = new EventDispatcher();
	private viewportObserver?: ViewportObserver;
	private options!: Required<ScrollMagicOptions>;
	private active?: boolean;
	constructor({
		element,
		scrollParent = window,
		vertical = true,
		trackEnd = 0,
		trackStart = 1,
		offset = 0,
	}: ScrollMagicOptions) {
		const options: Required<ScrollMagicOptions> = {
			element,
			scrollParent,
			vertical,
			trackEnd,
			trackStart,
			offset,
		};
		this.modify(options);

		const triggerElement = getElement(element);
		const containerElement = getScrollContainerElement(scrollParent);
		const container = ContainerManager.attach(this, containerElement);
		container.onUpdate(({ width: containerWidth, height: containerHeight }) => {
			if (!this.active) {
				return;
			}
			// todo not good. this is only temporary. we should not accss local vars, but options, as they might change.
			const { left, top, width, height } = triggerElement.getBoundingClientRect();
			const positionStart = vertical ? top / containerHeight : left / containerWidth;
			const positionEnd = vertical ? (top + height) / containerHeight : (left + width) / containerWidth;
			const trackSize = trackStart - trackEnd;
			const total = positionEnd - positionStart + trackSize;
			const passed = trackStart - positionStart;
			const progress = Math.min(Math.max(passed / total, 0), 1);
			this.dispatcher.dispatchEvent(new ScrollMagicProgressEvent(this, progress));
		});
		/**
		 * 
		 * for below setters: for changes always check if they actually do change
		 // TODO: Basicaly add IC and keep the rootMargin up to date.
		 * - add IntersectionController (IC), listening to elem ✅
		 * - trigger callbacks on enter & leave ✅
		 * - add trackStart and trackEnd options ✅
		 *   - validate (start > end) ✅
		 * - recreate IC when trackStart or trackEnd is set (setter) ✅
		 * - introduce offset (getter, setter) ✅
		 * - when offset changes:
		 * 	 - recreate IC ✅
		 *   - if (offset !== 0):
		 *      - use calculated px rootMargin based on trackStart, offset & current viewport height/width
		 * 		- listen for container resizes -> recreate IC
		 * - introduce height (getter, setter)
		 * - when height changes:
		 *   - recreate IC
		 * 	 - if (height !== 100% aber relativ (%)):
		 * 		- add ResizeObserver for element, recreate IC on height/width change
		 * - test all
		 * - next big thing: calclate progress during scene
		 */
	}

	public destroy(): void {
		this.viewportObserver?.disconnect();
		ContainerManager.detach(this);
	}

	private refreshViewportObserver(): void {
		const { scrollParent, element, vertical, trackEnd, trackStart, offset } = this.options;
		// todo: memoize this?
		const triggerElement = getElement(element);
		const containerElement = getScrollContainerElement(scrollParent);
		const container = ContainerManager.attach(this, containerElement);
		// console.log(container.info.size.height);
		// todo: allow offset to be relative to element size
		const start =
			offset === 0
				? `${trackStart * 100 - 100}%`
				: trackStart * container.info.size.height - container.info.size.height - (offset as number);
		const end = `${-trackEnd * 100}%`;
		const margin = {
			top: vertical ? end : 0,
			left: vertical ? 0 : end,
			bottom: vertical ? start : 0,
			right: vertical ? 0 : start,
		};
		// console.log(margin);
		const observerOptions = {
			margin,
			root: isWindow(containerElement) ? null : containerElement,
		};
		if (undefined === this.viewportObserver) {
			this.viewportObserver = new ViewportObserver(intersecting => {
				// only ever observing one element, so we can fairly assume it's this one
				// TODO: this should maybe not be done here? Also maybe this logic may be wrong - Should 'enter' be triggered if active on page load?
				if (undefined !== this.active) {
					this.dispatcher.dispatchEvent(
						new ScrollMagicEvent(
							this,
							intersecting ? ScrollMagicEventType.Enter : ScrollMagicEventType.Leave
						)
					);
				}
				this.active = intersecting;
			}, observerOptions);
		} else {
			this.viewportObserver.updateOptions(observerOptions);
		}
		this.viewportObserver.observe(triggerElement);
	}
	private validateOptions(options: Partial<ScrollMagicOptions>): void {
		const { trackEnd, trackStart } = {
			...this.options,
			...options,
		};
		if (Math.abs(trackEnd) > 1) {
			throw `Invalid value provided for 'trackEnd': ${trackEnd} (must be between 0 and 1)`; // todo better errors (duh)
		}
		if (Math.abs(trackStart) > 1) {
			throw `Invalid value provided for 'trackStart': ${trackStart} (must be between 0 and 1)`; // todo better errors (duh)
		}
	}
	public modify(options: Partial<ScrollMagicOptions>): Scene {
		this.validateOptions(options);
		this.options = {
			...this.options,
			...options,
		};
		this.refreshViewportObserver();
		return this;
	}

	// getter / setter
	public set element(element: Required<ScrollMagicOptions>['element']) {
		this.modify({ element });
	}
	public get element(): Required<ScrollMagicOptions>['element'] {
		return this.options.element;
	}
	public set scrollParent(scrollParent: Required<ScrollMagicOptions>['scrollParent']) {
		this.modify({ scrollParent });
	}
	public get scrollParent(): Required<ScrollMagicOptions>['scrollParent'] {
		return this.options.scrollParent;
	}
	public set vertical(vertical: Required<ScrollMagicOptions>['vertical']) {
		this.modify({ vertical });
	}
	public get vertical(): Required<ScrollMagicOptions>['vertical'] {
		return this.options.vertical;
	}
	public set trackStart(trackStart: Required<ScrollMagicOptions>['trackStart']) {
		this.modify({ trackStart });
	}
	public get trackStart(): Required<ScrollMagicOptions>['trackStart'] {
		return this.options.trackStart;
	}
	public set trackEnd(trackEnd: Required<ScrollMagicOptions>['trackEnd']) {
		this.modify({ trackEnd });
	}
	public get trackEnd(): Required<ScrollMagicOptions>['trackEnd'] {
		return this.options.trackEnd;
	}
	public set offset(offset: Required<ScrollMagicOptions>['offset']) {
		this.modify({ offset });
	}
	public get offset(): Required<ScrollMagicOptions>['offset'] {
		return this.options.offset;
	}

	// event listener
	public on<T extends ScrollMagicEventType>(type: T, cb: Callback<NarrowDownEvent<T>>): Scene {
		this.dispatcher.addEventListener(type, cb);
		return this;
	}
	public off(type: ScrollMagicEventType, cb: (e: ScrollMagicEvent) => void): Scene {
		this.dispatcher.removeEventListener(type, cb);
		return this;
	}
}
