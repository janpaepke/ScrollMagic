import { ContainerManager } from './ContainerManager';
import { getScrollContainerElement } from './util/getScrollContainerElement';

export interface ScrollMagicOptions {
	container?: Window | Document | HTMLElement | string;
}

export class Scene {
	public name = 'ScrollMagic';
	constructor({ container: containerElement }: ScrollMagicOptions = {}) {
		const container = ContainerManager.attach(this, getScrollContainerElement(containerElement));
		container.onUpdate(({ top }) => {
			console.log(top);
		});
	}
	public destroy(): void {
		ContainerManager.detach(this);
	}
}
