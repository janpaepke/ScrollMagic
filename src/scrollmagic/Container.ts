import EventDispatcher, { DispatchableEvent } from './EventDispatcher';
import debounce from './util/debounce';
import getInnerDimensions from './util/getInnerDimensions';
import getScrollPos from './util/getScrollPos';
import registerEvent from './util/registerEvent';
import throttleRaf from './util/throttleRaf';
import { isWindow } from './util/typeguards';

export type ScrollParent = HTMLElement | Window;

type CleanUpFunction = () => void;

type EventType = 'scroll' | 'resize';
export class ContainerEvent implements DispatchableEvent {
	constructor(public readonly type: EventType, public readonly target: Container) {}
}

const scroll = 'scroll';
const resize = 'resize';

export class Container {
	private scrollPosPrivate = { top: 0, left: 0 };
	private dimensions = { width: 0, height: 0 };
	private dispatcher = new EventDispatcher();
	private cleanups = new Array<CleanUpFunction>();

	constructor(public readonly scrollParent: ScrollParent) {
		const throttledScroll = throttleRaf(this.updateScrollPos.bind(this));
		const throttledResize = debounce(this.updateDimensions.bind(this), 100);
		this.cleanups.push(
			throttledScroll.cancel,
			throttledResize.cancel,
			this.subscribeScroll(throttledScroll),
			this.subscribeResize(throttledResize)
		);
		this.updateScrollPos();
		this.updateDimensions();
	}

	private updateScrollPos() {
		this.scrollPosPrivate = getScrollPos(this.scrollParent);
		this.dispatcher.dispatchEvent(new ContainerEvent(scroll, this));
	}
	private updateDimensions() {
		this.dimensions = getInnerDimensions(this.scrollParent);
		this.dispatcher.dispatchEvent(new ContainerEvent(resize, this));
	}

	// subscribes to resize events of scrollParent and returns a function to reverse the effect
	private subscribeResize(onResize: () => void) {
		const { scrollParent } = this;
		if (isWindow(scrollParent)) {
			return registerEvent(scrollParent, resize, onResize);
		}
		const observer = new ResizeObserver(onResize);
		observer.observe(scrollParent);
		return () => observer.unobserve(scrollParent);
	}

	// subscribes to scroll events of scrollParent and returns a function to reverse the effect
	private subscribeScroll(onScroll: () => void) {
		return registerEvent(this.scrollParent, scroll, onScroll);
	}

	// subscribes Container and returns a function to reverse the effect
	public subscribe(type: EventType, cb: (e: ContainerEvent) => void): () => void {
		return this.dispatcher.addEventListener(type, cb);
	}

	public get size(): Container['dimensions'] {
		return this.dimensions;
	}

	public get scrollPos(): Container['scrollPosPrivate'] {
		return this.scrollPosPrivate;
	}

	public destroy(): void {
		// TODO: Do all listeners need to be removed from dispatcher? Or the current one overwritten to remove all references to old one?
		this.cleanups.forEach(cleanup => cleanup());
		this.cleanups = [];
	}
}
