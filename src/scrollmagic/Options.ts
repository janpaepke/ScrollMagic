type Modify<T extends { [K in keyof T]: unknown }, R extends { [K in keyof T]: unknown }> = Omit<T, keyof R> & R;

export enum TrackShorthand {
	Enter = 'enter',
	Center = 'center',
	Leave = 'leave',
}

// takes the height of an element and returns an offset or height value in relation to it.
export type PixelConverter = (elementHeight: number) => number;

export type Public = {
	element: Element | string;
	scrollParent: Window | Document | Element | string;
	vertical: boolean;
	trackStart: number | TrackShorthand | `${TrackShorthand}`;
	trackEnd: number | TrackShorthand | `${TrackShorthand}`;
	offset: number | string; // number in px or string like 10px or -10%
	height: number | string; // number in px or string like 10px, -10%, +=10px or -=10%
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
		height: PixelConverter; // if unit is %, value will be 1 for 100%
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
	height: '100%',
};
