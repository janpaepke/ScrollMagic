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

const numberToPx = (val: number | string) => ('string' === typeof val ? val : `${val}px`);

export default class ViewportObserver {
	private observer?: IntersectionObserver;
	private options: Required<Options>;
	private observedElements = new Array<Element>();
	constructor(
		private callback: IntersectionObserverCallback,
		{ root = null, margin = { top: 0, right: 0, bottom: 0, left: 0 } }: Options = {}
	) {
		this.options = {
			root,
			margin,
		};
		this.rebuildObserver();
	}
	private rebuildObserver() {
		if (undefined !== this.observer) {
			this.observer.disconnect();
		}
		const root = this.options.root;
		const rootMargin = Object.values(this.options.margin).map(numberToPx).join(' ');
		const newObserver = new IntersectionObserver(this.callback, { root, rootMargin });
		this.observedElements.forEach(elem => newObserver.observe(elem));
		this.observer = newObserver;
	}
	private optionsChanged({ root, margin }: Options) {
		if (undefined !== root && root !== this.options.root) {
			return true;
		}
		if (undefined !== margin) {
			return Object.entries(this.options.margin).some(([key, value]) => value !== margin[key as keyof Margin]);
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
		if (!this.observedElements.includes(elem)) {
			this.observedElements.push(elem);
			this.observer!.observe(elem);
		}
		return this;
	}
	public unobserve(elem: Element): ViewportObserver {
		const index = this.observedElements.indexOf(elem);
		if (-1 < index) {
			this.observedElements.splice(index, 1);
			this.observer!.unobserve(elem);
		}
		return this;
	}
	public disconnect(): void {
		this.observer?.disconnect();
	}
}
