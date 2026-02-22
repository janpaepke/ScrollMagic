type NullableProperties<T extends object, K extends keyof T> = Omit<T, K> & {
	[X in K]: T[X] | null;
};
type UnitString = `${number}px` | `${number}%`;
type PositionShorthand = keyof typeof positionShorthands;
type CssSelector = string;

// takes the width or height of an element and returns the value that is used for position calculations
export type PixelConverter = (size: number) => number;

export type Public = {
	element?: Element | CssSelector | null;
	scrollParent?: Window | Element | CssSelector | null;
	vertical?: boolean;
	triggerStart?: number | UnitString | PositionShorthand | PixelConverter | null; // null means infer default values based on whether or not an element is supplied
	triggerEnd?: number | UnitString | PositionShorthand | PixelConverter | null; // null means infer default values based on whether or not an element is supplied
	elementStart?: number | UnitString | PositionShorthand | PixelConverter;
	elementEnd?: number | UnitString | PositionShorthand | PixelConverter;
};

// basically a normalized version of the options
export type Private = {
	element: Element;
	scrollParent: Window | HTMLElement;
	vertical: boolean;
	triggerStart: PixelConverter;
	triggerEnd: PixelConverter;
	elementStart: PixelConverter;
	elementEnd: PixelConverter;
};

// values that can be null after processing and need to be inferred, if still null
export type PrivateUninferred = NullableProperties<Private, 'element' | 'scrollParent' | 'triggerStart' | 'triggerEnd'>;

// shorthand values for bound position values
export const positionShorthands = {
	here: '0%',
	center: '50%',
	opposite: '100%',
} as const satisfies Record<string, UnitString>;

// default options
export const defaults: Required<Public> = {
	element: null,
	scrollParent: null,
	vertical: true,
	triggerStart: null,
	triggerEnd: null,
	elementStart: 0,
	elementEnd: 0,
};

// applied during fallback inference. if triggerStart or triggerEnd is null this will apply default if element is present and fallback otherwise
export const inferredTriggers: Record<string, PixelConverter> = {
	default: (scrollParentSize: number) => scrollParentSize, // default 100%, starts at bottom, ends at top
	fallback: () => 0, // if no element is supplied, it will fall back to the first child of scroll parent (usually the body), so it starts at the top and ends at the bottom
};
