import { isWindow } from './typeguards';

// info limited to what we need...
const getDimensions = (
	element: Window | Element
): { clientWidth: number; clientHeight: number; scrollWidth: number; scrollHeight: number } => {
	const elem = isWindow(element) ? document.documentElement : element;
	const { clientWidth, clientHeight, scrollHeight, scrollWidth } = elem;
	return {
		clientWidth,
		clientHeight,
		scrollHeight,
		scrollWidth,
	};
};

export default getDimensions;
