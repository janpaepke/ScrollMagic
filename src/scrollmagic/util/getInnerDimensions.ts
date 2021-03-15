import { isWindow } from './typeguards';

const getInnerDimensions = (element: Window | Element): { width: number; height: number } => {
	const elem = isWindow(element) ? document.documentElement : element;
	const { clientWidth, clientHeight } = elem;
	return {
		width: clientWidth,
		height: clientHeight,
	};
};

export default getInnerDimensions;
