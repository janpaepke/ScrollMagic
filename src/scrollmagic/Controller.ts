export interface ControllerOptions {
	container?: Window | Document | Element | string;
}

export class Controller {
	private container: Element;
	constructor({ container }: ControllerOptions = {}) {
		this.container = container as Element; // TODO
	}
}
