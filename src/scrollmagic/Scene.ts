import { ContainerManager } from './ContainerManager';
import EventDispatcher, {
	Callback,
	NarrowDownEvent,
	ScrollMagicEvent,
	ScrollMagicEventType,
	ScrollMagicProgressEvent,
} from './EventDispatcher';
import * as Options from './Options';
import pickDifferencesFlat from './util/pickDifferencesFlat';
import { isWindow } from './util/typeguards';
import validateObject from './util/validateObject';
import ViewportObserver from './ViewportObserver';

export { Public as ScrollMagicOptions } from './Options';
export class Scene {
	public readonly name = 'ScrollMagic';

	private static defaultOptionsPublic = Options.defaults;

	private dispatcher = new EventDispatcher();
	private viewportObserver?: ViewportObserver;

	private optionsPublic: Options.Public = Scene.defaultOptionsPublic;
	private optionsPrivate!: Options.Private; // set in modify in constructor
	private active?: boolean;

	// TODO: currently options.element isn't optional. Can we make it?
	constructor(options: Partial<Options.Public>) {
		const initOptions: Options.Public = {
			...Scene.defaultOptionsPublic,
			...options,
		};
		this.modify(initOptions);

		const container = ContainerManager.attach(this, this.optionsPrivate.scrollParent);
		container.onUpdate(({ width: containerWidth, height: containerHeight }) => {
			if (!this.active) {
				return;
			}
			// todo not good. this is only temporary. we should not accss local vars, but options, as they might change.
			const { vertical, trackEnd, trackStart, element } = this.optionsPrivate;
			const { left, top, width, height } = element.getBoundingClientRect();
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

	public modify(options: Partial<Options.Public>): Scene {
		const normalized = validateObject(options, Options.validationRules);
		const changed =
			undefined === this.optionsPrivate // internal options not set on first run...
				? normalized
				: pickDifferencesFlat(normalized, this.optionsPrivate);

		this.optionsPublic = {
			...this.optionsPublic,
			...options,
		};
		this.optionsPrivate = {
			...this.optionsPrivate,
			...changed,
		};
		this.refreshViewportObserver();
		return this;
	}

	private refreshViewportObserver(): void {
		const { scrollParent, element, vertical, trackEnd, trackStart, offset } = this.optionsPrivate;
		// todo: memoize this?
		const container = ContainerManager.attach(this, scrollParent);
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
			root: isWindow(scrollParent) ? null : scrollParent,
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
		this.viewportObserver.observe(element);
	}

	// getter / setter
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
	public static default(options: Partial<Options.Public> = {}): Options.Public {
		validateObject(options, Options.validationRules);
		this.defaultOptionsPublic = {
			...this.defaultOptionsPublic,
			...options,
		};
		return this.defaultOptionsPublic;
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

	public destroy(): void {
		this.viewportObserver?.disconnect();
		ContainerManager.detach(this);
	}
}
