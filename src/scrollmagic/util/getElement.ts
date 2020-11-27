export const getElement = (elem: Element | string): Element => {
	if (typeof elem === 'string') {
		return document.querySelectorAll(elem)[0];
	}
	return elem;
};
