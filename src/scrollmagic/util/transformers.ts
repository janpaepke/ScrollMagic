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

enum TrackShorthand {
	Enter = 'enter',
	Center = 'center',
	Leave = 'leave',
}
type PixelConverter = (elementHeight: number) => number;

export const numberToPercString = (val: number): string => `${val * 100}%`;

export const trackValueToNumber = (val: number | TrackShorthand | `${TrackShorthand}`): number => {
	if (isNumber(val)) {
		if (Math.abs(val) > 1) {
			throw failWith('Value must be a number between 0 and 1');
		}
		return val;
	}
	const numericEquivalents = {
		[TrackShorthand.Enter]: 1,
		[TrackShorthand.Center]: 0.5,
		[TrackShorthand.Leave]: 0,
	};
	const valid = Object.keys(numericEquivalents);
	if (!valid.includes(val)) {
		throw failWith(`Value must be number or one of: ${valid.join(' / ')}`);
	}
	return numericEquivalents[val];
};

export const stringToPixelConverter = (val: string, allowRelative = false): PixelConverter => {
	// if unit is %, value will be 1 for 100%
	const match = val.match(/^([+-])?(=)?(\d+|\d*[.]\d+)(%|px)$/);
	if (isNull(match)) {
		const allowedFormat = allowRelative
			? ' or relative values, i.e. 20px, 80%, +=20px or +=10%'
			: ', i.e. 20px or 80%';
		throw failWith(`Value must be number or string with unit${allowedFormat}`);
	}
	const [, sign, equal, digits, unit] = match as [string, string | null, string | null, string, string];
	const value = parseFloat(`${sign ?? ''}${digits}`);
	const relative = equal === '=';
	if (relative && !allowRelative) {
		throw failWith(`Relative values (+=...) are not supported`);
	}
	const getPx = unit === 'px' ? () => value : (height: number) => (value / 100) * height;
	return relative ? height => getPx(height) + height : getPx;
};

export const numberOrStringToPixelConverter = (val: number | string, allowRelative = false): PixelConverter => {
	if (isNumber(val)) {
		return () => val;
	}
	return stringToPixelConverter(val, allowRelative);
};

export const numberOrStringToPixelConverterAllowRelative = (val: number | string): PixelConverter => {
	return numberOrStringToPixelConverter(val, true);
};

export const selectorToSingleElement = (selector: string): Element => {
	const elem = document.querySelector(selector);
	if (isNull(elem)) {
		throw failWith(`No element found for selector ${selector}`);
	}
	return elem;
};

export const selectorOrElementToHTMLorSVG = (reference: Element | string): HTMLElement | SVGElement => {
	const elem = isString(reference) ? selectorToSingleElement(reference) : reference;
	const { body } = window.document;
	if (!(isHTMLElement(elem) || isSVGElement(elem)) || !body.contains(elem)) {
		throw failWith('Invalid element supplied');
	}
	return elem;
};

export const elementOrSelectorToScrollParent = (
	container: Window | Document | Element | string
): Window | HTMLElement => {
	if (isWindow(container) || isDocument(container)) {
		return window;
	}
	const elem = selectorOrElementToHTMLorSVG(container);
	if (isSVGElement(elem)) {
		throw failWith(`Can't use SVG as scrollParent`);
	}
	return elem;
};

export const stringPropertiesToNumber = <T extends Record<string, string>>(obj: T): Record<keyof T, number> =>
	Object.entries(obj).reduce(
		(res, [key, value]) => ({ ...res, [key]: parseFloat(value) }),
		{} as Record<keyof T, number>
	);

export const nullPassThrough = <F extends (val: any) => any>(
	func: F
): ((val: Parameters<F>[0] | null) => ReturnType<F> | null) => (val: Parameters<F>[0] | null) =>
	isNull(val) ? val : func(val);

// checks if a value is null and returns it, if it is not.
// if it is, it can either return a fallback value or function, which is executed to return an alternative
export const toNonNullable = <T extends unknown, U extends (() => NonNullable<T>) | NonNullable<T>>(
	val: T,
	fallbackTo: U
): NonNullable<T> =>
	isNull(val) || isUndefined(val)
		? typeof fallbackTo === 'function'
			? fallbackTo()
			: fallbackTo
		: (val as NonNullable<T>);

export const passThrough = <T extends unknown>(val: T): T => val;
