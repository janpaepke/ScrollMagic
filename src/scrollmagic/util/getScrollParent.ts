import { getElement } from './getElement';
import { isWindow, isDocument } from './typeguards';

// normalizes input to return a valid scroll container of type Element
export const getScrollParent = (
	container: Window | Document | HTMLElement | string | undefined
): HTMLElement | Window => {
	const body = window.document.body;
	if (undefined === container || isWindow(container) || isDocument(container)) {
		return window;
	}
	const scrollElement = getElement(container);
	if (!body.contains(scrollElement)) {
		throw 'ASD'; // TODO
	}
	return scrollElement;
};
