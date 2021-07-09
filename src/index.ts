import { EventLocation, EventType, ScrollDirection } from './ScrollMagicEvent';

// make literals from enums for export
type EventTypeLiteral = `${EventType}`;
type EventLocationLiteral = `${EventLocation}`;
type ScrollDirectionLiteral = `${ScrollDirection}`;

export { ScrollMagic as default } from './ScrollMagic';

// relevant types
export type { ScrollMagicError } from './ScrollMagicError';
export type { ScrollMagicEvent } from './ScrollMagicEvent';
export type { Plugin as ScrollMagicPlugin } from './ScrollMagic';
export type { Public as ScrollMagicOptions } from './Options';

// less relevant enum types as literals
export type {
	EventTypeLiteral as EventType,
	EventLocationLiteral as EventLocation,
	ScrollDirectionLiteral as ScrollDirection,
};
