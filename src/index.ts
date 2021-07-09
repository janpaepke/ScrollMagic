import { EventLocation, EventType, ScrollDirection } from './ScrollMagicEvent';

// make literals from enums for export
type EventTypeLiteral = `${EventType}`;
type EventLocationLiteral = `${EventLocation}`;
type ScrollDirectionLiteral = `${ScrollDirection}`;

export { ScrollMagic as default } from './ScrollMagic';

// types
export type { ScrollMagicError } from './ScrollMagicError';
export type { ScrollMagicEvent } from './ScrollMagicEvent';
export type { Plugin } from './ScrollMagic';
export type { Public as Options } from './Options';
export type {
	EventTypeLiteral as EventType,
	EventLocationLiteral as EventLocation,
	ScrollDirectionLiteral as ScrollDirection,
};
