import { getScrollPos } from './util/getScrollPos';

export type ContainerElement = HTMLElement | Window;

type UpdateCallback = (scrollInfo: { top: number; left: number }) => void;

export class Container {
	private scrollPos = { top: 0, left: 0 };
	private scheduledUpdate: number | undefined; // identifier for a delayed update, undefined if none scheduled.
	private callbacks = new Array<UpdateCallback>();
	constructor(private scrollElement: ContainerElement) {
		this.throttledUpdate = this.throttledUpdate.bind(this);
		this.scrollElement.addEventListener('scroll', this.throttledUpdate);
		this.scrollElement.addEventListener('resize', this.throttledUpdate);
		this.throttledUpdate();
	}
	private update() {
		this.scrollPos = getScrollPos(this.scrollElement);
		this.callbacks.forEach(cb => cb(this.scrollPos));
	}
	private throttledUpdate() {
		// do immediate stuff?
		if (undefined === this.scheduledUpdate) {
			this.scheduledUpdate = window.requestAnimationFrame(() => {
				this.scheduledUpdate = undefined;
				this.update();
			});
		}
	}

	public onUpdate(cb: UpdateCallback): void {
		this.callbacks.push(cb);
	}

	public destroy(): void {
		if (undefined !== this.scheduledUpdate) {
			window.cancelAnimationFrame(this.scheduledUpdate);
		}
		this.callbacks = [];
		this.scrollElement.removeEventListener('resize', this.throttledUpdate);
		this.scrollElement.removeEventListener('scroll', this.throttledUpdate);
	}
}
