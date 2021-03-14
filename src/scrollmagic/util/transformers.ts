import { TrackShorthand } from 'scrollmagic/Options';

import { isNumber } from './typeguards';

const throwError = (message?: string): never => {
	throw new Error(message);
};

const assert = (condition: boolean, message?: string): never | true => {
	if (!condition) {
		throwError(message);
	}
	return true;
};

export const numberToPercString = (val: number): string => `${val * 100}%`;

export const isBetweenZeroAndOne = (val: number): number =>
	assert(Math.abs(val) <= 1, 'Value must be a number between 0 and 1.') && val;

export const trackValueToNumber = (val: number | TrackShorthand | `${TrackShorthand}`): number => {
	if (isNumber(val)) {
		return val;
	}
	const numericEquivalents = {
		[TrackShorthand.Enter]: 1,
		[TrackShorthand.Center]: 0.5,
		[TrackShorthand.Leave]: 0,
	};
	const valid = Object.keys(numericEquivalents);
	assert(valid.includes(val), `Value must be numeric or one of: ${valid.join(' / ')}`);
	return numericEquivalents[val];
};

export const stringToUnitTuple = (val: string): [value: number, unit: string] => {
	// if unit is %, value will be 1 for 100%
	const match = val.match(/^(\d+|\d*[.]\d+)(%|px)$/);
	if (match === null) {
		throw new Error(`Can't convert supplied string value to unit Tuple.`);
	}
	const value = parseFloat(match[1]);
	const unit = match[2];
	return [unit === 'px' ? value : value / 100, unit];
};

export const numberOrStringToUnitTuple = (val: number | string): [value: number, unit: string] => {
	if (isNumber(val)) {
		return [val, 'px'];
	}
	try {
		return stringToUnitTuple(val);
	} catch (e) {
		return throwError('Value must be number or string with unit, i.e. 20px or 80%');
	}
};
