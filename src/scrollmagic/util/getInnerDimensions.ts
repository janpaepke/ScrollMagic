import { isWindow } from './typeguards';

const getInnerDimensions = (element: Window | HTMLElement): { width: number; height: number } => ({
	width: isWindow(element) ? window.innerWidth : element.clientWidth,
	height: isWindow(element) ? window.innerHeight : element.clientHeight,
});

export default getInnerDimensions;
