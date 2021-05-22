import { DispatchableEvent } from './EventDispatcher';
import { ScrollMagic } from './ScrollMagic';

export enum EventType {
	Enter = 'enter',
	Leave = 'leave',
	Progress = 'progress',
}

export enum EventLocation {
	Start = 'start',
	Inside = 'inside',
	End = 'end',
}

export enum ScrollDirection {
	Forward = 'forward',
	Reverse = 'reverse',
}

type EnumToLiteral<T extends string> = `${T}`;
type ScrollMagicEventType = EnumToLiteral<EventType>;
type ScrollMagicEventLocation = EnumToLiteral<EventLocation>;
type ScrollMagicEventScrollDirection = EnumToLiteral<ScrollDirection>;

export class ScrollMagicEvent implements DispatchableEvent {
	public readonly location: ScrollMagicEventLocation;
	public readonly direction: ScrollMagicEventScrollDirection;
	constructor(
		public readonly target: ScrollMagic,
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
