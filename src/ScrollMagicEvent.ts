import type { DispatchableEvent } from './EventDispatcher';
import type { ScrollMagic } from './ScrollMagic';

/** Lifecycle event types dispatched by a ScrollMagic instance. */
export enum EventType {
	/** Fired when the element enters the active scroll zone. */
	Enter = 'enter',
	/** Fired when the element leaves the active scroll zone. */
	Leave = 'leave',
	/** Fired on every scroll update while the element is inside the active zone. */
	Progress = 'progress',
}

/** Where the event occurred relative to the active scroll zone. */
export enum EventLocation {
	/** At the leading edge of the zone (entering forward or leaving in reverse). */
	Start = 'start',
	/** Between the start and end edges. */
	Inside = 'inside',
	/** At the trailing edge of the zone (entering in reverse or leaving forward). */
	End = 'end',
}

/** Scroll direction at the time the event was dispatched. */
export enum ScrollDirection {
	/** Scrolling toward higher scroll offsets (down or right). */
	Forward = 'forward',
	/** Scrolling toward lower scroll offsets (up or left). */
	Reverse = 'reverse',
}

type EnumOrLiteral<T extends string> = T | `${T}`;
type ScrollMagicEventType = EnumOrLiteral<EventType>;
type ScrollMagicEventLocation = EnumOrLiteral<EventLocation>;
type ScrollMagicEventScrollDirection = EnumOrLiteral<ScrollDirection>;

/**
 * Event object dispatched by ScrollMagic on lifecycle transitions and progress updates.
 *
 * Instances are created internally and passed to listeners registered via {@link ScrollMagic.on} or {@link ScrollMagic.subscribe}.
 */
export class ScrollMagicEvent implements DispatchableEvent {
	/** Where the event occurred relative to the active zone (`'start'`, `'inside'`, or `'end'`). */
	public readonly location: ScrollMagicEventLocation;
	/** Scroll direction at the time of the event (`'forward'` or `'reverse'`). */
	public readonly direction: ScrollMagicEventScrollDirection;
	constructor(
		/** The ScrollMagic instance that dispatched this event. */
		public readonly target: ScrollMagic,
		/** The event type (`'enter'`, `'leave'`, or `'progress'`). */
		public readonly type: ScrollMagicEventType,
		movingForward: boolean
	) {
		this.location = (() => {
			if (EventType.Progress === type) {
				return EventLocation.Inside;
			}
			if ((EventType.Enter === type && movingForward) || (EventType.Leave === type && !movingForward)) {
				return EventLocation.Start;
			}
			return EventLocation.End;
		})();
		this.direction = movingForward ? ScrollDirection.Forward : ScrollDirection.Reverse;
	}
}
