import getElement from './util/getElement';
import getScrollContainerElement from './util/getScrollContainerElement';
import { ValidationRules } from './util/validateObject';

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
	trackEnd: 'leave',
	trackStart: 'enter',
	offset: 0,
	height: '100%',
};

const assert = (condition: boolean, message?: string) => {
	if (!condition) {
		throw new Error(message);
	}
};
const betweenZeroAndOne = (val: number) => assert(Math.abs(val) <= 1, 'Value must be a number between 0 and 1.');
const normalizeTrack = (val: number | TrackShorthand | `${TrackShorthand}`) => {
	if (typeof val === 'number') {
		return val;
	}
	const numericEquivalents: Record<TrackShorthand, number> = {
		[TrackShorthand.Enter]: 1,
		[TrackShorthand.Center]: 0.5,
		[TrackShorthand.Leave]: 0,
	};
	const valid = Object.keys(numericEquivalents);
	assert(valid.includes(val), `Value must be numeric or one of: ${valid.join(' / ')}`);
	return numericEquivalents[val];
};

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
};
