import { getScrollParent } from './util/getScrollParent';
import { getScrollPos } from './util/getScrollPos';

export interface ControllerOptions {
	container?: Window | HTMLElement | string;
	horizontal?: boolean;
}

export class Controller {
	private scrollParent: HTMLElement | Window;
	private scrollPos: number;
	private scheduledUpdate: number | undefined; // identifier for a delayed update, undefined if none scheduled.
	private horizontal: boolean;
	constructor({ container, horizontal }: ControllerOptions = {}) {
		this.scrollParent = getScrollParent(container);
		console.log(this.scrollParent);
		this.throttledUpdate = this.throttledUpdate.bind(this);
		this.scrollParent.addEventListener('scroll', this.throttledUpdate);
		this.scrollParent.addEventListener('resize', this.throttledUpdate);
		this.scrollPos = 0;
		this.horizontal = !!horizontal;
		this.throttledUpdate();
	}
	private update() {
		this.scrollPos = getScrollPos(this.scrollParent, this.horizontal);
		// get scrollpos
		// get viewpoert size / position
		// scene updates
		console.log(this.scrollPos);
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

	public destroy(): null {
		if (undefined !== this.scheduledUpdate) {
			window.cancelAnimationFrame(this.scheduledUpdate);
		}
		this.scrollParent.removeEventListener('resize', this.throttledUpdate);
		this.scrollParent.removeEventListener('scroll', this.throttledUpdate);
		return null;
	}
}
