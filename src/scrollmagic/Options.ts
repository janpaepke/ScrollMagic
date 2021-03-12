import getElement from './util/getElement';
import getScrollContainerElement from './util/getScrollContainerElement';
import { stringToUnitTuple } from './util/transformers';
import { isNumber } from './util/typeguards';
import { ValidationRules } from './util/validateObject';

type Modify<T extends Record<keyof T, any>, R extends Record<keyof T, any>> = Omit<T, keyof R> & R;

export enum TrackShorthand {
	Enter = 'enter',
	Center = 'center',
	Leave = 'leave',
}
export interface Public {
	element: HTMLElement | string;
	scrollParent: Window | Document | HTMLElement | string;
	vertical: boolean;
	trackStart: number | TrackShorthand | `${TrackShorthand}`;
	trackEnd: number | TrackShorthand | `${TrackShorthand}`;
	offset: number | string;
	height: number | string;
}

// basically a normalized version of the options
export type Private = Modify<
	Public,
	{
		element: HTMLElement;
		scrollParent: Window | HTMLElement;
		vertical: boolean;
		trackStart: number;
		trackEnd: number;
		offset: [value: number, unit: string]; // if unit is %, value will be 1 for 100%
		height: [value: number, unit: string]; // if unit is %, value will be 1 for 100%
	}
>;

export const defaults: Public = {
	element: 'body', // TODO: crap? remove!
	scrollParent: window,
	vertical: true,
	trackEnd: 'leave',
	trackStart: 'enter',
	offset: 0,
	height: '100%',
};

const throwError = (message?: string): never => {
	throw new Error(message);
};

const assert = (condition: boolean, message?: string): never | true => {
	if (!condition) {
		throwError(message);
	}
	return true;
};

const betweenZeroAndOne = (val: number): number =>
	assert(Math.abs(val) <= 1, 'Value must be a number between 0 and 1.') && val;

const normalizeTrack = (val: number | TrackShorthand | `${TrackShorthand}`): number => {
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
const toUnitTuple = (val: number | string): [value: number, unit: string] => {
	if (isNumber(val)) {
		return [val, 'px'];
	}
	try {
		return stringToUnitTuple(val);
	} catch (e) {
		return throwError('Value must be number or string with unit, i.e. 20px or 80%');
	}
};

// TODO: make type safe and then use
/**
 * -> first function expects parameters of any type
 * -> Each function expets return type of previous function
 * -> the result of the last function is returned as the batch result
 * https://stackoverflow.com/questions/53173203/typescript-recursive-function-composition
 */
const batch = (...fnList: Array<(...args: any) => any>) => (...args: any) => {
	let res = args;
	fnList.forEach(fn => {
		res = fn.apply(args);
	});
	return res;
};

const x = batch(val => val + 1);

export const validationRules: ValidationRules<Public, Private> = {
	element: {
		normalize: val => getElement(val),
	},
	scrollParent: {
		normalize: val => getScrollContainerElement(val),
	},
	trackStart: {
		normalize: normalizeTrack,
		check: betweenZeroAndOne,
	},
	trackEnd: {
		normalize: normalizeTrack,
		check: betweenZeroAndOne,
	},
	offset: {
		normalize: toUnitTuple,
	},
	height: {
		normalize: toUnitTuple,
	},
};
