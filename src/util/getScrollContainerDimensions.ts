import { isWindow } from './typeguards';

interface Dimensions {
	readonly clientWidth: number;
	readonly clientHeight: number;
	readonly scrollWidth: number;
	readonly scrollHeight: number;
}

// info limited to what we need...
export const getScrollContainerDimensions = (element: Window | Element): Dimensions => {
	const elem = isWindow(element) ? document.documentElement : element;
	const { clientWidth, scrollHeight, scrollWidth } = elem;
	let { clientHeight } = elem;
	if (isWindow(element) && null != window.visualViewport) {
		// visualViewport.height accounts for mobile browser chrome (address bar show/hide)
		// multiplying by scale compensates for pinch-zoom, giving us the layout viewport height
		clientHeight = window.visualViewport.height * window.visualViewport.scale;
	}
	return {
		clientWidth,
		clientHeight,
		scrollHeight,
		scrollWidth,
	};
};
