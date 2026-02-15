import { pickDifferencesFlat } from './util/pickDifferencesFlat';
import { isUndefined } from './util/typeguards';

type Margin = {
	top: string;
	right: string;
	bottom: string;
	left: string;
};

interface Options {
	root?: Element | null; // null is window
	margin?: Margin;
	vertical?: boolean;
}

type ObserverCallback = (isIntersecting: boolean, target: Element) => void;

// this ensures the order in the object doesn't matter
const marginObjToString = ({ top, right, bottom, left }: Margin) => [top, right, bottom, left].join(' ');

const none = '0px';

// resolves the combined state of enter/leave observers into a single boolean or undefined (if not yet fully initialized)
const resolveState = (hitEnter: boolean | undefined, hitLeave: boolean | undefined): boolean | undefined => {
	if (hitEnter === undefined || hitLeave === undefined) return undefined;
	return hitEnter && hitLeave;
};

export class ViewportObserver {
	private observerEnter?: IntersectionObserver;
	private observerLeave?: IntersectionObserver;
	private options: Required<Options> = {
		root: null,
		margin: { top: none, right: none, bottom: none, left: none },
		vertical: true,
	};
	private observedElements = new Map<Element, [boolean | undefined, boolean | undefined]>();
	constructor(
		private callback: ObserverCallback,
		options?: Options
	) {
		if (isUndefined(options)) {
			return; // nothing will happen, until modify is called.
		}
		this.options = {
			...this.options,
			...options,
		};
	}
	private observerCallback(entries: IntersectionObserverEntry[], observer: IntersectionObserver) {
		entries.forEach(({ target, isIntersecting }) => {
			let [hitEnter, hitLeave] = this.observedElements.get(target) ?? [];
			const prevState = resolveState(hitEnter, hitLeave);
			if (observer === this.observerEnter) {
				hitEnter = isIntersecting;
			} else {
				hitLeave = isIntersecting;
			}
			this.observedElements.set(target, [hitEnter, hitLeave]);
			const newState = resolveState(hitEnter, hitLeave);
			if (isUndefined(newState) || prevState === newState) {
				return;
			}
			this.callback(newState, target);
		});
	}
	private createObserver(rootMargin: string) {
		const root = this.options.root;
		const observer = new IntersectionObserver(this.observerCallback.bind(this), { root, rootMargin });
		[...this.observedElements.keys()].forEach(elem => observer.observe(elem));
		return observer;
	}
	private rebuildObserver() {
		this.observerEnter?.disconnect();
		this.observerLeave?.disconnect();
		const { margin, vertical } = this.options;
		const clampPositive = (val: string) => `${Math.max(0, parseFloat(val))}%`;

		// The enter observer clips the "leave side" margin to >= 0 (so it doesn't shrink the viewport on that side).
		// The leave observer clips the "enter side" margin to >= 0.
		// For vertical: leave side = top, enter side = bottom.
		// For horizontal: leave side = left, enter side = right.
		// TODO: check what happens, if the opposite value still overlaps (due to offset / height ?)
		// TODO! I know now: if effective duration exceeds available observer height it fails... -> BUG! -> FIX...
		const marginEnter =
			vertical ? { ...margin, top: clampPositive(margin.top) } : { ...margin, left: clampPositive(margin.left) };
		const marginLeave =
			vertical ?
				{ ...margin, bottom: clampPositive(margin.bottom) }
			:	{ ...margin, right: clampPositive(margin.right) };

		this.observerEnter = this.createObserver(marginObjToString(marginEnter));
		this.observerLeave = this.createObserver(marginObjToString(marginLeave));
	}
	private optionsChanged({ root, margin, vertical }: Options) {
		if (!isUndefined(root) && root !== this.options.root) {
			return true;
		}
		if (!isUndefined(vertical) && vertical !== this.options.vertical) {
			return true;
		}
		if (!isUndefined(margin)) {
			return Object.keys(pickDifferencesFlat(margin, this.options.margin)).length > 0;
		}
		return false;
	}

	public modify(options: Options): ViewportObserver {
		if (!this.optionsChanged(options)) {
			return this;
		}
		this.options = {
			...this.options,
			...options,
		};
		this.rebuildObserver();
		return this;
	}
	public observe(elem: Element): ViewportObserver {
		if (!this.observedElements.has(elem)) {
			this.observedElements.set(elem, [undefined, undefined]);
			this.observerEnter?.observe(elem);
			this.observerLeave?.observe(elem);
		}
		return this;
	}
	public unobserve(elem: Element): ViewportObserver {
		if (this.observedElements.delete(elem)) {
			this.observerEnter?.unobserve(elem);
			this.observerLeave?.unobserve(elem);
		}
		return this;
	}
	public disconnect(): void {
		this.observedElements.clear();
		this.observerEnter?.disconnect();
		this.observerLeave?.disconnect();
	}
}
