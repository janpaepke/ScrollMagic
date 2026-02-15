import { isWindow } from './typeguards';

const scrollTop = (container: Window | Element): number =>
	isWindow(container) ? (window.scrollY ?? window.pageYOffset) : container.scrollTop;

const scrollLeft = (container: Window | Element): number =>
	isWindow(container) ? (window.scrollX ?? window.pageXOffset) : container.scrollLeft;

export const getScrollPos = (container: Window | Element): { left: number; top: number } => ({
	left: scrollLeft(container),
	top: scrollTop(container),
});
