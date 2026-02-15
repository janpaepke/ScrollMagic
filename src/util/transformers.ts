import { makeError } from '../ScrollMagicError';
import { isHTMLElement, isNull, isNumber, isSVGElement, isString, isUndefined, isWindow } from './typeguards';

type PixelConverter = (size: number) => number;
type UnitString = `${number}px` | `${number}%`;

const centerShorthand = 'center';

export const numberToPercString = (val: number, decimals: number): string => `${(val * 100).toFixed(decimals)}%`;

const unitTupleToPixelConverter = ([value, unit]: [number, 'px' | '%']): PixelConverter => {
	return unit === 'px' ? () => value : (size: number) => (value / 100) * size;
};

export const unitStringToPixelConverter = (val: UnitString): PixelConverter => {
	const match = val.match(/^([+-])?(\d+|\d*[.]\d+)(%|px)$/);
	if (isNull(match)) {
		throw makeError(`String value must be number with unit, i.e. 20px or 80% or '${centerShorthand}' (equal to 50%)`);
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
			return unitTupleToPixelConverter([50, '%']);
		}
		return unitStringToPixelConverter(val);
	}
	// ok, user passed in a function, let's see if it works.
	let returnsNumber: boolean;
	try {
		returnsNumber = isNumber(val(1));
	} catch {
		throw makeError('Unsupported value type');
	}
	if (!returnsNumber) {
		throw makeError('Function must return a number');
	}
	return val;
};

export const selectorToSingleElement = (selector: string): Element => {
	const elem = document.querySelector(selector);
	if (isNull(elem)) {
		throw makeError(`No element found for selector ${selector}`);
	}
	return elem;
};

export const toSvgOrHtmlElement = (reference: Element | string): HTMLElement | SVGElement => {
	const elem = isString(reference) ? selectorToSingleElement(reference) : reference;
	const { body } = document;
	if (!(isHTMLElement(elem) || isSVGElement(elem)) || !body.contains(elem)) {
		throw makeError('Invalid element supplied');
	}
	return elem;
};

export const toValidScrollParent = (container: Window | Element | string): HTMLElement | Window => {
	if (isWindow(container)) {
		return container;
	}
	const elem = toSvgOrHtmlElement(container);
	if (isSVGElement(elem)) {
		throw makeError(`Can't use SVG as scrollParent`);
	}
	return elem;
};

// returns null if null is passed in or returns the return value of the function that's passed in.
export const nullPassThrough =
	<F extends (val: any) => any>(func: F): ((val: Parameters<F>[0] | null) => ReturnType<F> | null) =>
	(val: Parameters<F>[0] | null) =>
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return -- generic HOF return type is intentionally any
		isNull(val) ? val : func(val);

// checks if a value is null and returns it, if it is not.
// if it is, it runs a function to recover a value
export const toNonNullable = <T>(val: T, recover: () => NonNullable<T>): NonNullable<T> =>
	isNull(val) || isUndefined(val) ? recover() : (val as NonNullable<T>);

export const toBoolean = (val: unknown): boolean => !!val;
