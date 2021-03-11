import pickDifferencesFlat from './util/pickDifferencesFlat';

type Margin = {
	top: number | string;
	right: number | string;
	bottom: number | string;
	left: number | string;
};

interface Options {
	root?: Element | null; // null is window
	margin?: Margin;
}

type ObserverCallback = (isIntersecting: boolean, target: Element) => void;

const numberToPx = (val: number | string) => ('string' === typeof val ? val : `${val}px`);
const marginObjToString = ({ top, right, bottom, left }: Margin) =>
	[top, right, bottom, left].map(numberToPx).join(' ');

export default class ViewportObserver {
	private observerEnter?: IntersectionObserver;
	private observerLeave?: IntersectionObserver;
	private options: Required<Options>;
	private observedElements = new Map<Element, [boolean | undefined, boolean | undefined]>();
	constructor(
		private callback: ObserverCallback,
		{ root = null, margin = { top: 0, right: 0, bottom: 0, left: 0 } }: Options = {}
	) {
		this.options = {
			root,
			margin,
		};
		this.rebuildObserver();
	}
	private observerCallback(entries: IntersectionObserverEntry[], observer: IntersectionObserver) {
		entries.forEach(({ target, isIntersecting }) => {
			let [hitEnter, hitLeave] = this.observedElements.get(target) ?? [];
			const prevState = hitEnter && hitLeave;
			if (observer === this.observerEnter) {
				hitEnter = isIntersecting;
			} else {
				hitLeave = isIntersecting;
			}
			this.observedElements.set(target, [hitEnter, hitLeave]);
			const newState = hitEnter && hitLeave;
			if (undefined === newState || prevState === newState) {
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

		// todo: check what happens, if the opposite value still overlaps (due to offset / height ?)
		const marginEnter = { ...this.options.margin, top: 0 };
		const marginLeave = { ...this.options.margin, bottom: 0 };

		this.observerEnter = this.createObserver(marginObjToString(marginEnter));
		this.observerLeave = this.createObserver(marginObjToString(marginLeave));
	}
	private optionsChanged({ root, margin }: Options) {
		if (undefined !== root && root !== this.options.root) {
			return true;
		}
		if (undefined !== margin) {
			return Object.keys(pickDifferencesFlat(margin, this.options.margin)).length === 0;
		}
		return false;
	}

	public updateOptions(options: Options): ViewportObserver {
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
			this.observerEnter!.observe(elem);
			this.observerLeave!.observe(elem);
		}
		return this;
	}
	public unobserve(elem: Element): ViewportObserver {
		if (this.observedElements.has(elem)) {
			this.observedElements.delete(elem);
			this.observerEnter!.unobserve(elem);
			this.observerLeave!.unobserve(elem);
		}
		return this;
	}
	public disconnect(): void {
		this.observerEnter?.disconnect();
		this.observerLeave?.disconnect();
	}
}
