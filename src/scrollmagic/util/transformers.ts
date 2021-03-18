import { failWith } from 'scrollmagic/ScrollMagicError';

import {
	isDocument,
	isHTMLElement,
	isNull,
	isNumber,
	isSVGElement,
	isString,
	isUndefined,
	isWindow,
} from './typeguards';

type PixelConverter = (size: number) => number;
type UnitString = `${number}px` | `${number}%`;

const centerShorthand = 'center';

export const numberToPercString = (val: number): string => `${val * 100}%`;

const unitTupleToPixelConverter = ([value, unit]: [number, 'px' | '%']): PixelConverter => {
	return unit === 'px' ? () => value : (size: number) => (value / 100) * size;
};

export const unitStringToPixelConverter = (val: UnitString): PixelConverter => {
	const match = val.match(/^([+-])?(\d+|\d*[.]\d+)(%|px)$/);
	if (isNull(match)) {
		throw failWith(`String value must be number with unit, i.e. 20px or 80% or '${centerShorthand}' (=50%)`);
	}
	const [, sign, digits, unit] = match as [string, '+' | '-' | null, string, 'px' | '%'];
	return unitTupleToPixelConverter([parseFloat(`${sign ?? ''}${digits}`), unit]);
};

export const toPixelConverter = (
	val: number | UnitString | typeof centerShorthand | PixelConverter
): PixelConverter => {
	if (isNumber(val)) {
		return () => val;
	}
	if (isString(val)) {
		if (centerShorthand === val) {
			const x = unitTupleToPixelConverter([50, '%']);
			return x;
		}
		return unitStringToPixelConverter(val);
	}
	// ok, probably passed in function, let's see if it works.
	let returnsNumber: boolean;
	try {
		returnsNumber = isNumber(val(1));
	} catch (e) {
		throw failWith('Unsupported value type');
	}
	if (!returnsNumber) {
		throw failWith('Function must return a number');
	}
	return val;
};

export const selectorToSingleElement = (selector: string): Element => {
	const elem = document.querySelector(selector);
	if (isNull(elem)) {
		throw failWith(`No element found for selector ${selector}`);
	}
	return elem;
};

export const toSvgOrHtmlElement = (reference: Element | string): HTMLElement | SVGElement => {
	const elem = isString(reference) ? selectorToSingleElement(reference) : reference;
	const { body } = window.document;
	if (!(isHTMLElement(elem) || isSVGElement(elem)) || !body.contains(elem)) {
		throw failWith('Invalid element supplied');
	}
	return elem;
};

export const toValidScrollParent = (container: Window | Document | Element | string): Window | HTMLElement => {
	if (isWindow(container) || isDocument(container)) {
		return window;
	}
	const elem = toSvgOrHtmlElement(container);
	if (isSVGElement(elem)) {
		throw failWith(`Can't use SVG as scrollParent`);
	}
	return elem;
};

// returns null if null is passed in or returns the return value of the function that's passed in.
export const nullPassThrough = <F extends (val: any) => any>(
	func: F
): ((val: Parameters<F>[0] | null) => ReturnType<F> | null) => (val: Parameters<F>[0] | null) =>
	isNull(val) ? val : func(val);

// checks if a value is null and returns it, if it is not.
// if it is, it runs a function to recover a value
export const toNonNullable = <T extends unknown>(val: T, recover: () => NonNullable<T>): NonNullable<T> =>
	isNull(val) || isUndefined(val) ? recover() : (val as NonNullable<T>);

export const toBoolean = (val: unknown): boolean => !!val;
