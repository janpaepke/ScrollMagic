import debounce from './util/debounce';
import getInnerDimensions from './util/getInnerDimensions';
import getScrollPos from './util/getScrollPos';
import registerEvent from './util/registerEvent';
import throttleRaf from './util/throttleRaf';

export type ContainerElement = HTMLElement | Window;

type UpdateCallback = (scrollInfo: { top: number; left: number }) => void;
type CleanUpFunction = () => void;

export class Container {
	private scrollPos = { top: 0, left: 0 };
	private dimensions = { width: 0, height: 0 };
	private callbacks = new Array<UpdateCallback>();
	private cleanups = new Array<CleanUpFunction>();

	constructor(private scrollElement: ContainerElement) {
		const throttledScroll = throttleRaf(this.updateScrollPos.bind(this));
		const throttledResize = debounce(this.updateDimensions.bind(this), 100);
		this.cleanups.push(
			throttledScroll.cancel,
			throttledResize.cancel,
			registerEvent(scrollElement, 'scroll', throttledScroll),
			registerEvent(scrollElement, 'resize', throttledResize)
		);
		this.updateScrollPos();
		this.updateDimensions();
	}

	private updateScrollPos() {
		this.scrollPos = getScrollPos(this.scrollElement);
		this.callbacks.forEach(cb => cb(this.scrollPos));
	}
	private updateDimensions() {
		this.dimensions = getInnerDimensions(this.scrollElement);
		this.callbacks.forEach(cb => cb(this.scrollPos));
	}

	public onUpdate(cb: UpdateCallback): void {
		this.callbacks.push(cb);
	}

	public get info() {
		return {
			scrollPos: this.scrollPos,
			size: this.dimensions,
		};
	}

	public destroy(): void {
		this.cleanups.forEach(cleanup => cleanup());
		this.cleanups = [];
		this.callbacks = [];
	}
}
