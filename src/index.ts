import type { Public as ScrollMagicOptions } from './Options';
import type { Plugin as ScrollMagicPlugin } from './ScrollMagic';
import { EventLocation, EventType, ScrollDirection } from './ScrollMagicEvent';

// make literals from enums for export
type EventTypeLiteral = `${EventType}`;
type EventLocationLiteral = `${EventLocation}`;
type ScrollDirectionLiteral = `${ScrollDirection}`;

export { ScrollMagic as default } from './ScrollMagic';

// relevant types
export type { ScrollMagicError } from './ScrollMagicError';
export type { ScrollMagicEvent } from './ScrollMagicEvent';
export type { ScrollMagicPlugin };
export type { ScrollMagicOptions };

// less relevant enum types as literals
export type {
	EventTypeLiteral as EventType,
	EventLocationLiteral as EventLocation,
	ScrollDirectionLiteral as ScrollDirection,
};
