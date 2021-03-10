import { isWindow } from './typeguards';

const getInnerDimensions = (element: Window | HTMLElement): { width: number; height: number } => ({
	width: isWindow(element) ? document.documentElement.clientWidth : element.clientWidth,
	height: isWindow(element) ? document.documentElement.clientHeight : element.clientHeight,
});

export default getInnerDimensions;
