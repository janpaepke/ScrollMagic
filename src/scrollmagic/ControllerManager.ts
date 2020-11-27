import { Controller } from './Controller';
import { getScrollContainer } from './util/getScrollContainer';

const activeControllers = new Map<Element, Controller>();

export const getController = (container?: Window | Document | Element | string): Controller => {
	const scrollContainer = getScrollContainer(container);
	let controller = activeControllers.get(scrollContainer);
	if (undefined === controller) {
		controller = new Controller();
		activeControllers.set(scrollContainer, controller);
	}
	console.log(activeControllers);
	return controller;
};
