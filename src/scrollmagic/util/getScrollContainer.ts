import { getElement } from './getElement';

export const getScrollContainer = (container: Window | Document | Element | string | undefined): Element => {
	const body = window.document.body;
	if (undefined === container || window === container || window.document === container) {
		return body;
	}
	const scrollElement = getElement(container as Element | string); // TODO better!
	if (!body.contains(scrollElement)) {
		throw 'ASD'; // TODO
	}
	return scrollElement;
};
