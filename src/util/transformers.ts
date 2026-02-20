import { positionShorthands } from '../Options';
import { ScrollMagicError } from '../ScrollMagicError';
import { isHTMLElement, isSVGElement, isWindow } from './typeguards';

type PixelConverter = (size: number) => number;
type UnitTuple = [number, 'px' | '%'];

export const numberToPercString = (val: number, decimals: number): string => `${(val * 100).toFixed(decimals)}%`;

const unitTupleToPixelConverter = ([value, unit]: UnitTuple): PixelConverter => {
	return 'px' === unit || 0 === value ? () => value : (size: number) => (value / 100) * size;
};

export const unitStringToPixelConverter = (val: string): PixelConverter => {
	const match = val.match(/^([+-])?(\d+|\d*[.]\d+)(%|px)$/);
	if (null === match) {
		const names = Object.keys(positionShorthands).join(', ');
		throw new ScrollMagicError(
			`String value must be a number with unit (e.g. 20px, 80%) or a named position (${names})`
		);
	}
	const [, sign, digits, unit] = match as [string, '+' | '-' | null, string, 'px' | '%'];
	return unitTupleToPixelConverter([parseFloat(`${sign ?? ''}${digits}`), unit]);
};

export const toPixelConverter = (val: number | string | PixelConverter): PixelConverter => {
	if ('number' === typeof val) {
		return () => val;
	}
	if ('string' === typeof val) {
		const unitString = val in positionShorthands ? positionShorthands[val as keyof typeof positionShorthands] : val;
		return unitStringToPixelConverter(unitString);
	}
	// ok, user passed in a function, let's see if it works.
	let returnsNumber: boolean;
	try {
		returnsNumber = 'number' === typeof val(1);
	} catch {
		throw new ScrollMagicError('Unsupported value type');
	}
	if (!returnsNumber) {
		throw new ScrollMagicError('Function must return a number');
	}
	return val;
};

export const selectorToSingleElement = (selector: string): Element => {
	const elem = document.querySelector(selector);
	if (null === elem) {
		throw new ScrollMagicError(`No element found for selector ${selector}`);
	}
	return elem;
};

export const toSvgOrHtmlElement = (reference: Element | string): HTMLElement | SVGElement => {
	const elem = 'string' === typeof reference ? selectorToSingleElement(reference) : reference;
	const { body } = document;
	if (!(isHTMLElement(elem) || isSVGElement(elem)) || !body.contains(elem)) {
		throw new ScrollMagicError('Invalid element supplied');
	}
	return elem;
};

export const toValidScrollParent = (container: Window | Element | string): HTMLElement | Window => {
	if (isWindow(container)) {
		return container;
	}
	const elem = toSvgOrHtmlElement(container);
	if (isSVGElement(elem)) {
		throw new ScrollMagicError(`Can't use SVG as scrollParent`);
	}
	return elem;
};

/** Wraps a function to pass `null` through without calling it. */
export const skipNull =
	<T, R>(fn: (val: T) => R) =>
	(val: T | null): R | null =>
		null === val ? null : fn(val);
