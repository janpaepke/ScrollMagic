type SameProperties<T extends { [K in keyof T]: unknown }, R extends { [K in keyof T]: unknown }> = R;
type ExtendProperty<T extends { [K in keyof T]: unknown }, K extends keyof T, E> = Omit<T, K> & { [X in K]: T[X] | E };
type ModifyProperty<T extends { [K in keyof T]: unknown }, K extends keyof T, E> = Omit<T, K> & { [X in K]: E };
type UnitString = `${number}px` | `${number}%`;
type CenterShorthand = 'center';
type CssSelector = string;

// takes the width or height height of an element and returns the value that is used for position calculations
export type PixelConverter = (size: number) => number;

export type Public = {
	element?: Element | CssSelector | null;
	scrollParent?: Window | Document | Element | CssSelector;
	vertical?: boolean;
	triggerStart?: number | UnitString | CenterShorthand | PixelConverter | null; // null means infer default values based on wether or not an element is supplied
	triggerEnd?: number | UnitString | CenterShorthand | PixelConverter | null; // null means infer default values based on wether or not an element is supplied
	elementStart?: number | UnitString | CenterShorthand | PixelConverter;
	elementEnd?: number | UnitString | CenterShorthand | PixelConverter;
};

// basically a normalized version of the options
export type Private = SameProperties<
	Public,
	{
		element: Element;
		scrollParent: Window | HTMLElement;
		vertical: boolean;
		triggerStart: PixelConverter;
		triggerEnd: PixelConverter;
		elementStart: PixelConverter;
		elementEnd: PixelConverter;
	}
>;

// values that can be null after processing and need to be inferred, if still null
export type PrivateUninferred = ExtendProperty<Private, 'triggerStart' | 'triggerEnd' | 'element', null>;
// PixelConverters are executed and their values returned during computation
export type PrivateComputed = ModifyProperty<
	Private,
	'triggerStart' | 'triggerEnd' | 'elementStart' | 'elementEnd',
	number
>;

// default options
export const defaults: Required<Public> = {
	element: null,
	scrollParent: window,
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
