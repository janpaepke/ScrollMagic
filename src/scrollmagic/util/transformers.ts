import * as Options from 'scrollmagic/Options';
import { failWith } from 'scrollmagic/ScrollMagicError';

import { isDocument, isHTMLElement, isNumber, isString, isWindow } from './typeguards';

export const numberToPercString = (val: number): string => `${val * 100}%`;

export const isBetweenZeroAndOne = (val: number): number => {
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

export const stringToUnitTuple = (val: string): [value: number, unit: string] => {
	// if unit is %, value will be 1 for 100%
	const match = val.match(/^(\d+|\d*[.]\d+)(%|px)$/);
	if (match === null) {
		throw failWith(`Value must be number or string with unit, i.e. 20px or 80%`);
	}
	const value = parseFloat(match[1]);
	const unit = match[2];
	return [unit === 'px' ? value : value / 100, unit];
};

export const numberOrStringToUnitTuple = (val: number | string): [value: number, unit: string] => {
	if (isNumber(val)) {
		return [val, 'px'];
	}
	return stringToUnitTuple(val);
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
