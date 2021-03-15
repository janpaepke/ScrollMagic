import { warn } from './ScrollMagicError';
import { batch } from './util/batch';
import processProperties, { PropertyProcessors } from './util/processProperties';
import { sanitizeProperties } from './util/sanitizeProperties';
import {
	assertBetweenZeroAndOne,
	elementOrSelectorToScrollParent,
	numberOrStringToPixelConverter,
	numberOrStringToPixelConverterAllowRelative,
	selectorOrElementToHTMLorSVG,
	trackValueToNumber,
} from './util/transformers';

type Modify<T extends { [K in keyof T]: unknown }, R extends { [K in keyof T]: unknown }> = Omit<T, keyof R> & R;

enum TrackShorthand {
	Enter = 'enter',
	Center = 'center',
	Leave = 'leave',
}

// takes the height of an element and returns an offset or height value in relation to it.
type PixelConverter = (elementHeight: number) => number;

export type Public = {
	element: Element | string;
	scrollParent: Window | Document | Element | string;
	vertical: boolean;
	trackStart: number | TrackShorthand | `${TrackShorthand}`;
	trackEnd: number | TrackShorthand | `${TrackShorthand}`;
	offset: number | string; // number in px or string like 10px or -10%
	size: number | string; // number in px or string like 10px, -10%, +=10px or -=10%
};

// basically a normalized version of the options
export type Private = Modify<
	Public,
	{
		element: HTMLElement | SVGElement;
		scrollParent: Window | HTMLElement;
		vertical: boolean;
		trackStart: number;
		trackEnd: number;
		offset: PixelConverter; // if unit is %, value will be 1 for 100%
		size: PixelConverter; // if unit is %, value will be 1 for 100%
		test: number;
	}
>;

export const defaults: Public = {
	element: 'body',
	scrollParent: window,
	vertical: true,
	trackEnd: 'leave',
	trackStart: 'enter',
	offset: 0,
	size: '100%',
};

const propertyProcessors: PropertyProcessors<Public, Private> = {
	element: selectorOrElementToHTMLorSVG,
	scrollParent: elementOrSelectorToScrollParent,
	trackStart: batch(trackValueToNumber, assertBetweenZeroAndOne),
	trackEnd: batch(trackValueToNumber, assertBetweenZeroAndOne),
	offset: numberOrStringToPixelConverter,
	size: numberOrStringToPixelConverterAllowRelative,
};

export const sanitize = (obj: Record<string, any>): Partial<Public> =>
	sanitizeProperties(obj, defaults, (propertyName: string) => {
		warn(`Unknown option ${propertyName} will be disregarded`);
	});

export const process = (obj: Partial<Public>): Partial<Private> => processProperties(obj, propertyProcessors);
