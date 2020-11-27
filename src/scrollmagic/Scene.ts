import { Controller } from './Controller';
import { getController } from './ControllerManager';

export interface SceneOptions {
	container?: Element | string; // todo elem oder so
}
export class Scene {
	private controller: Controller;
	constructor({ container }: SceneOptions = {}) {
		this.controller = getController(container);
	}
}
