import { isWindow } from './typeguards';

const scrollTop = (container: Window | Element): number =>
	isWindow(container) ? window.pageYOffset : container.scrollTop;

const scrollLeft = (container: Window | Element): number =>
	isWindow(container) ? window.pageXOffset : container.scrollLeft;

const getScrollPos = (container: Window | Element): { left: number; top: number } => ({
	left: scrollLeft(container),
	top: scrollTop(container),
});
export default getScrollPos;
