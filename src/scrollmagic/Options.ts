import getElement from './util/getElement';
import getScrollContainerElement from './util/getScrollContainerElement';
import { ValidationRules } from './util/validateObject';

export interface Public {
	element: HTMLElement | string;
	scrollParent: Window | Document | HTMLElement | string;
	vertical: boolean;
	trackStart: number;
	trackEnd: number;
	offset: number | string;
	height: number | string;
}

// basically a normalized version of the options
export interface Private extends Public {
	element: HTMLElement;
	scrollParent: Window | HTMLElement;
	vertical: boolean;
	trackStart: number;
	trackEnd: number;
	offset: number;
	height: number;
}

export const defaults: Public = {
	element: 'body', // TODO: crap? remove!
	scrollParent: window,
	vertical: true,
	trackEnd: 0,
	trackStart: 1,
	offset: 0,
	height: '100%',
};

const assert = (condition: boolean, message?: string) => {
	if (!condition) {
		throw new Error(message);
	}
};
const betweenZeroAndOne = (val: number) => assert(Math.abs(val) <= 1, 'Value must be a number between 0 and 1.');

export const validationRules: ValidationRules<Public, Private> = {
	element: {
		normalize: val => getElement(val),
	},
	scrollParent: {
		normalize: val => getScrollContainerElement(val),
	},
	trackStart: {
		check: betweenZeroAndOne,
	},
	trackEnd: {
		check: betweenZeroAndOne,
	},
};
