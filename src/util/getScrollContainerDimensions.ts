import { isWindow } from './typeguards';

interface Dimensions {
	readonly clientWidth: number;
	readonly clientHeight: number;
	readonly scrollWidth: number;
	readonly scrollHeight: number;
}

// info limited to what we need...
const getScrollContainerDimensions = (element: Window | Element): Dimensions => {
	const elem = isWindow(element) ? document.documentElement : element;
	const { clientWidth, scrollHeight, scrollWidth } = elem;
	let { clientHeight } = elem;
	if (isWindow(element)) {
		// this is supposed to normalize for mobile, where the clientHeight excludes the menu bar, even when hidden after scroll
		// not sure how reliable this is, but so far it seems to work well
		const { innerHeight } = element;
		if (innerHeight - 15 > clientHeight) {
			clientHeight = innerHeight;
		}
	}
	return {
		clientWidth,
		clientHeight,
		scrollHeight,
		scrollWidth,
	};
};

export default getScrollContainerDimensions;
