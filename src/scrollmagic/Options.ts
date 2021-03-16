import { failWith, warn } from './ScrollMagicError';
import getInnerDimensions from './util/getInnerDimensions';
import { pickRelevantValues } from './util/pickRelevantInfo';
import processProperties, { PropertyProcessors } from './util/processProperties';
import { sanitizeProperties } from './util/sanitizeProperties';
import {
	elementOrSelectorToScrollParent,
	numberOrStringToPixelConverter,
	numberOrStringToPixelConverterAllowRelative,
	passThroughNull,
	selectorOrElementToHTMLorSVG,
	trackValueToNumber,
} from './util/transformers';
import { isNull, isWindow } from './util/typeguards';

type Modify<T extends { [K in keyof T]: unknown }, R extends { [K in keyof T]: unknown }> = Omit<T, keyof R> & R;
type ExtendProperty<T extends { [K in keyof T]: unknown }, K extends keyof T, E> = Omit<T, K> & { [X in K]: T[X] | E };

enum TrackShorthand {
	Enter = 'enter',
	Center = 'center',
	Leave = 'leave',
}

// takes the height of an element and returns an offset or height value in relation to it.
type PixelConverter = (elementHeight: number) => number;

export type Public = {
	element: Element | string | null;
	scrollParent: Window | Document | Element | string;
	vertical: boolean;
	trackStart: number | TrackShorthand | `${TrackShorthand}` | null;
	trackEnd: number | TrackShorthand | `${TrackShorthand}` | null;
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

type PrivateUninferred = ExtendProperty<Private, 'trackStart' | 'trackEnd' | 'element', null>;

export const defaults: Public = {
	element: null,
	scrollParent: window,
	vertical: true,
	trackEnd: null,
	trackStart: null,
	offset: 0,
	size: '100%',
};

const inferredTrackDefaults = {
	smallerThanViewport: {
		trackStart: 1,
		trackEnd: 0,
	},
	largerThanViewport: {
		trackStart: 0,
		trackEnd: 1,
	},
};

const transformers: PropertyProcessors<Public, PrivateUninferred> = {
	element: passThroughNull(selectorOrElementToHTMLorSVG),
	scrollParent: elementOrSelectorToScrollParent,
	trackStart: passThroughNull(trackValueToNumber),
	trackEnd: passThroughNull(trackValueToNumber),
	offset: numberOrStringToPixelConverter,
	size: numberOrStringToPixelConverterAllowRelative,
};

export const sanitize = (obj: Record<string, any>): Partial<Public> =>
	sanitizeProperties(obj, defaults, (propertyName: string) => {
		warn(`Unknown option ${propertyName} will be disregarded`);
	});

export const process = (obj: Partial<Public>): Partial<PrivateUninferred> => processProperties(obj, transformers);

export const inferNullValues = (obj: PrivateUninferred): Private => {
	let { trackStart, trackEnd, element } = obj; // these three need to be inferred, if null.
	const { vertical, scrollParent } = obj;
	if (isNull(element)) {
		element = isWindow(scrollParent) ? document.body : (scrollParent.firstElementChild as HTMLElement | SVGElement);
		if (isNull(element)) {
			failWith(`Could not autodetect element, as scrollParent has no children.`);
		}
	}

	const { size: containerSize } = pickRelevantValues(vertical, getInnerDimensions(scrollParent));
	const { size: elementSize } = pickRelevantValues(vertical, element.getBoundingClientRect());
	const isLargerThanViewport = elementSize > containerSize;
	const trackDefaults = isLargerThanViewport
		? inferredTrackDefaults.largerThanViewport
		: inferredTrackDefaults.smallerThanViewport;

	if (isNull(trackStart)) {
		trackStart = trackDefaults.trackStart;
	}
	if (isNull(trackEnd)) {
		trackEnd = trackDefaults.trackEnd;
	}
	return {
		...obj,
		element,
		trackStart,
		trackEnd,
	};
};
