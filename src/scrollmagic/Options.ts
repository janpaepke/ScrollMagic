type Modify<T extends Record<keyof T, any>, R extends Record<keyof T, any>> = Omit<T, keyof R> & R;

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

export type UnitTuple = [value: number, unit: string];
// basically a normalized version of the options
export type Private = Modify<
	Public,
	{
		element: HTMLElement;
		scrollParent: Window | HTMLElement;
		vertical: boolean;
		trackStart: number;
		trackEnd: number;
		offset: UnitTuple; // if unit is %, value will be 1 for 100%
		height: UnitTuple; // if unit is %, value will be 1 for 100%
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
