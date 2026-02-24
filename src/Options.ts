type NullableProperties<T extends object, K extends keyof T> = Omit<T, K> & {
	[X in K]: T[X] | null;
};
type UnitString = `${number}px` | `${number}%`;
type PositionShorthand = keyof typeof positionShorthands;
type CssSelector = string;

/** Converts an element's or container's current size (in pixels) to a pixel offset used for position calculations. */
export type PixelConverter = (size: number) => number;

/** Public configuration options accepted by the ScrollMagic constructor and `modify()`. */
export type Public = {
	/** The tracked element (or CSS selector). Defaults to the first child of `container`. Set to `null` to reset. */
	element?: Element | CssSelector | null;
	/** Start **inset** on the element. Positive values shrink the tracked region from the leading edge. @default 0 */
	elementStart?: number | UnitString | PositionShorthand | PixelConverter;
	/** End **inset** on the element. Positive values shrink the tracked region from the trailing edge. @default 0 */
	elementEnd?: number | UnitString | PositionShorthand | PixelConverter;
	/** The scroll container (or CSS selector). Defaults to `window`. Set to `null` to reset. */
	container?: Window | Element | CssSelector | null;
	/** Start **inset** on the scroll container. Set to `null` to infer based on `element`. @default null (inferred) */
	containerStart?: number | UnitString | PositionShorthand | PixelConverter | null;
	/** End **inset** on the scroll container. Set to `null` to infer based on `element`. @default null (inferred) */
	containerEnd?: number | UnitString | PositionShorthand | PixelConverter | null;
	/** Scroll axis. `true` = vertical, `false` = horizontal. @default true */
	vertical?: boolean;
};

// basically a normalized version of the options
export type Private = {
	element: Element;
	elementStart: PixelConverter;
	elementEnd: PixelConverter;
	container: Window | HTMLElement;
	containerStart: PixelConverter;
	containerEnd: PixelConverter;
	vertical: boolean;
};

// values that can be null after processing and need to be inferred, if still null
export type PrivateUninferred = NullableProperties<
	Private,
	'element' | 'container' | 'containerStart' | 'containerEnd'
>;

/** Named position shorthands that resolve to percentage strings for element and container offsets. */
export const positionShorthands = {
	here: '0%',
	center: '50%',
	opposite: '100%',
} as const satisfies Record<string, UnitString>;

/** Default values for all public options. Returned (and optionally overridden) by `ScrollMagic.defaultOptions()`. */
export const defaults: Required<Public> = {
	element: null,
	elementStart: 0,
	elementEnd: 0,
	container: null,
	containerStart: null,
	containerEnd: null,
	vertical: true,
};

// applied during fallback inference. if containerStart or containerEnd is null this will apply default if element is present and fallback otherwise
export const inferredContainerDefaults: Record<string, PixelConverter> = {
	default: (containerSize: number) => containerSize, // default 100%, starts at bottom, ends at top
	fallback: () => 0, // if no element is supplied, it will fall back to the first child of the container (usually the body), so it starts at the top and ends at the bottom
};
