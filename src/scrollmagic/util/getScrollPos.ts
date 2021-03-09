import { isWindow } from './typeguards';

const scrollTop = (container: Window | HTMLElement): number =>
	isWindow(container) ? window.pageYOffset : container.scrollTop;

const scrollLeft = (container: Window | HTMLElement): number =>
	isWindow(container) ? window.pageXOffset : container.scrollLeft;

const getScrollPos = (container: Window | HTMLElement): { left: number; top: number } => ({
	left: scrollLeft(container),
	top: scrollTop(container),
});
export default getScrollPos;
