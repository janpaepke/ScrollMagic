const isHTMLElement = (o: Node): o is HTMLElement =>
	typeof HTMLElement === 'object' || typeof HTMLElement === 'function'
		? o instanceof HTMLElement || o instanceof SVGElement //DOM2
		: o && typeof o === 'object' && o !== null && o.nodeType === 1 && typeof o.nodeName === 'string';

const firstMatch = (selector: string) => document.querySelectorAll(selector)[0];

export const getElement = (reference: Node | string): HTMLElement => {
	const elem = typeof reference === 'string' ? firstMatch(reference) : reference;
	if (!isHTMLElement(elem)) {
		throw 'invalid element'; // TODO
	}
	return elem;
};
