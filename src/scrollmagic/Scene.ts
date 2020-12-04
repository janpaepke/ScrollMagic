import { Controller } from './Controller';
import { ControllerCache } from './ControllerCache';
import { getScrollParent } from './util/getScrollParent';

export interface SceneOptions {
	container?: HTMLElement | string;
}

// a cache shared among all scenes
const controllerCache = new ControllerCache();
export class Scene {
	private controller: Controller;
	constructor({ container }: SceneOptions = {}) {
		const scrollParent = getScrollParent(container);
		this.controller = controllerCache.add(scrollParent);
	}
}
