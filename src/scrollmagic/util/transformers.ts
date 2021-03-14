import * as Options from 'scrollmagic/Options';
import { failWith } from 'scrollmagic/ScrollMagicError';

import { isDocument, isHTMLElement, isNumber, isString, isWindow } from './typeguards';

export const numberToPercString = (val: number): string => `${val * 100}%`;

export const assertBetweenZeroAndOne = (val: number): number => {
	if (Math.abs(val) > 1) {
		throw failWith('Value must be a number between 0 and 1');
	}
	return val;
};

export const trackValueToNumber = (val: number | Options.TrackShorthand | `${Options.TrackShorthand}`): number => {
	if (isNumber(val)) {
		return val;
	}
	const numericEquivalents = {
		[Options.TrackShorthand.Enter]: 1,
		[Options.TrackShorthand.Center]: 0.5,
		[Options.TrackShorthand.Leave]: 0,
	};
	const valid = Object.keys(numericEquivalents);
	if (!valid.includes(val)) {
		throw failWith(`Value must be number or one of: ${valid.join(' / ')}`);
	}
	return numericEquivalents[val];
};

export const stringToPixelConverter = (val: string, allowRelative = false): Options.PixelConverter => {
	// if unit is %, value will be 1 for 100%
	const match = val.match(/^([+-])?(=)?(\d+|\d*[.]\d+)(%|px)$/);
	if (match === null) {
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

export const numberOrStringToPixelConverter = (val: number | string, allowRelative = false): Options.PixelConverter => {
	if (isNumber(val)) {
		return () => val;
	}
	return stringToPixelConverter(val, allowRelative);
};

export const numberOrStringToPixelConverterAllowRelative = (val: number | string): Options.PixelConverter => {
	return numberOrStringToPixelConverter(val, true);
};

export const selectorToSingleElement = (selector: string): Element => {
	const nodeList = document.querySelectorAll(selector);
	const { length } = nodeList;
	if (length !== 1) {
		const issue = length === 0 ? 'No element found' : 'More than one element found';
		throw failWith(`${issue} for selector ${selector}`);
	}
	return nodeList[0];
};

export const selectorOrElementToHtmlElement = (reference: HTMLElement | string): HTMLElement => {
	const elem = isString(reference) ? selectorToSingleElement(reference) : reference;
	const { body } = window.document;
	if (!isHTMLElement(elem) || !body.contains(elem)) {
		throw failWith('Invalid element supplied');
	}
	return elem;
};

export const scrollParentOptionToScrollParent = (
	container: Options.Public['scrollParent']
): Options.Private['scrollParent'] => {
	if (isWindow(container) || isDocument(container)) {
		return window;
	}
	return selectorOrElementToHtmlElement(container);
};
