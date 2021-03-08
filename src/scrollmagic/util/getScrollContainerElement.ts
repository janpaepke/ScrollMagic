import { getElement } from './getElement';
import { isDocument, isWindow } from './typeguards';

// normalizes input to return a valid scroll container of type Element
export const getScrollContainerElement = (
	container: Window | Document | HTMLElement | string
): HTMLElement | Window => {
	const body = window.document.body;
	if (isWindow(container) || isDocument(container)) {
		return window;
	}
	const scrollElement = getElement(container);
	if (!body.contains(scrollElement)) {
		throw 'ASD'; // TODO
	}
	return scrollElement;
};
