import { Controller } from './Controller';

export class ControllerCache {
	private controllers = new Map<HTMLElement | Window, Controller>();

	// adds a controller for a specific scroll container
	add(scrollContainer: HTMLElement | Window): Controller {
		let controller = this.controllers.get(scrollContainer);
		if (undefined === controller) {
			controller = new Controller({ container: scrollContainer });
			this.controllers.set(scrollContainer, controller);
		}
		return controller;
	}
	remove(): boolean {
		// TODO if all scenes are removed from a cached controller, it should be destroyed.
		return true;
	}
}
