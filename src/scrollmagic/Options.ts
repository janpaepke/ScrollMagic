type Modify<T extends { [K in keyof T]: unknown }, R extends { [K in keyof T]: unknown }> = Omit<T, keyof R> & R;

export enum TrackShorthand {
	Enter = 'enter',
	Center = 'center',
	Leave = 'leave',
}

// takes the height of an element and returns an offset or height value in relation to it.
export type PixelConverter = (elementHeight: number) => number;

export type Public = {
	element: HTMLElement | string;
	scrollParent: Window | Document | HTMLElement | string;
	vertical: boolean;
	trackStart: number | TrackShorthand | `${TrackShorthand}`;
	trackEnd: number | TrackShorthand | `${TrackShorthand}`;
	offset: number | string;
	height: number | string; // todo: suppport +=10px, +=20%, +=10vh
};

// basically a normalized version of the options
export type Private = Modify<
	Public,
	{
		element: HTMLElement;
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
	element: 'body', // TODO: crap? remove!
	scrollParent: window,
	vertical: true,
	trackEnd: 'leave',
	trackStart: 'enter',
	offset: 0,
	height: '100%',
};

// todo function to 'check consistency' to check for value combinations  that may not make sense:
// - offset/height values puts end before start
// - track values -> no overlap of track and element (warn)
