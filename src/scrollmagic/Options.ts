import { failWith, warn } from './ScrollMagicError';
import getInnerDimensions from './util/getInnerDimensions';
import { pickRelevantValues } from './util/pickRelevantInfo';
import processProperties, { PropertyProcessors } from './util/processProperties';
import { sanitizeProperties } from './util/sanitizeProperties';
import {
	elementOrSelectorToScrollParent,
	nullPassThrough,
	numberOrStringToPixelConverter,
	numberOrStringToPixelConverterAllowRelative,
	passThrough,
	selectorOrElementToHTMLorSVG,
	toNonNullable,
	trackValueToNumber,
} from './util/transformers';
import { isNull, isUndefined, isWindow } from './util/typeguards';

type SameProperties<T extends { [K in keyof T]: unknown }, R extends { [K in keyof T]: unknown }> = R;
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
export type Private = SameProperties<
	Public,
	{
		element: HTMLElement | SVGElement;
		scrollParent: Window | HTMLElement;
		vertical: boolean;
		trackStart: number;
		trackEnd: number;
		offset: PixelConverter; // if unit is %, value will be 1 for 100%
		size: PixelConverter; // if unit is %, value will be 1 for 100%
	}
>;
export const defaults: Public = {
	element: null,
	scrollParent: window,
	vertical: true,
	trackEnd: null,
	trackStart: null,
	offset: 0,
	size: '100%',
};

// values that can be null after processing and need to be inferred, if still null
type PrivateUninferred = ExtendProperty<Private, 'trackStart' | 'trackEnd' | 'element', null>;
// applied during fallback inference. if the element is larger than the viewport, `large` is used, otherwise `small`
const inferredTrackDefaults = {
	large: {
		trackStart: 0,
		trackEnd: 1,
	},
	small: {
		trackStart: 1,
		trackEnd: 0,
	},
};

const transformers: PropertyProcessors<Public, PrivateUninferred> = {
	element: nullPassThrough(selectorOrElementToHTMLorSVG),
	scrollParent: elementOrSelectorToScrollParent,
	vertical: passThrough,
	trackStart: nullPassThrough(trackValueToNumber),
	trackEnd: nullPassThrough(trackValueToNumber),
	offset: numberOrStringToPixelConverter,
	size: numberOrStringToPixelConverterAllowRelative,
};

// removes unknown properties from supplied options
export const sanitize = <T extends Partial<Public>>(options: T): T => sanitizeProperties(options, defaults);

// converts all public values to their corresponding private value, leaving null values untoched
const transform = (options: Partial<Public>): Partial<PrivateUninferred> => processProperties(options, transformers);

// processes remaining null values
const infer = (options: PrivateUninferred): Private => {
	const { vertical, scrollParent } = options;
	// get element first, cause we'll need that for the tracks
	const getFirstChild = () => {
		const elem = isWindow(scrollParent) ? document.body : scrollParent.firstElementChild;
		if (isNull(elem)) {
			throw failWith(`Could not autodetect element, as scrollParent has no children.`);
		}
		return selectorOrElementToHTMLorSVG(elem);
	};

	const inferred = processProperties(options, {
		element: elem => toNonNullable(elem, () => getFirstChild()),
	});

	const isLargerThanViewport = (() => {
		// cache it so it doesn't have to run twice.
		let isLarger: boolean | undefined;
		return () => {
			if (!isUndefined(isLarger)) {
				return isLarger;
			}
			const { size: containerSize } = pickRelevantValues(vertical, getInnerDimensions(scrollParent));
			const { size: elementSize } = pickRelevantValues(vertical, inferred.element.getBoundingClientRect());
			isLarger = elementSize > containerSize;
			return isLarger;
		};
	})();

	const getTrackDefault = (which: 'trackStart' | 'trackEnd') =>
		inferredTrackDefaults[isLargerThanViewport() ? 'large' : 'small'][which];

	return processProperties(inferred, {
		trackStart: val => toNonNullable(val, () => getTrackDefault('trackStart')),
		trackEnd: val => toNonNullable(val, () => getTrackDefault('trackEnd')),
	});
};

// checks if the options the user entered actually make sense
const check = (options: Private): void => {
	const { trackEnd, trackStart, element, scrollParent, vertical, size, offset } = options;
	const { size: elementSize } = pickRelevantValues(vertical, element.getBoundingClientRect());
	const { size: containerSize } = pickRelevantValues(vertical, getInnerDimensions(scrollParent));

	const relativeDistance = size(elementSize) / containerSize;
	const trackDistance = trackStart - trackEnd;

	const total = relativeDistance + trackDistance;
	if (total < 0) {
		warn(
			'Detected no overlap with the configured track options. This means ScrollMagic will not trigger unless this changes later on (i.e. due to resizes).',
			output(options)
		);
	}
};

export const output = (options: Private): ExtendProperty<Private, 'size' | 'offset', number> => {
	const { element, vertical, size, offset } = options;
	const { size: elementSize } = pickRelevantValues(vertical, element.getBoundingClientRect());
	return {
		...options,
		offset: offset(elementSize),
		size: size(elementSize),
	};
};

export const process = <T extends Partial<Public>>(
	newOptions: T,
	oldOptions: Private
): { sanitized: T; processed: Private } => {
	const sanitized = sanitize(newOptions);
	const normalized = transform(sanitized);
	const processed = infer({ ...oldOptions, ...normalized });
	check(processed);
	return { sanitized, processed };
};
