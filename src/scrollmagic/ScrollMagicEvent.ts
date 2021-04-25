import { DispatchableEvent } from './EventDispatcher';
import { ScrollMagic } from './ScrollMagic';

export enum EventType {
	Enter = 'enter',
	Leave = 'leave',
	Progress = 'progress',
}

enum EventLocation {
	Start = 'start',
	Inside = 'inside',
	End = 'end',
}

enum ScrollDirection {
	Forward = 'forward',
	Reverse = 'reverse',
}

type EnumToLiteral<T extends string> = `${T}`;
export type ScrollMagicEventType = EnumToLiteral<EventType>;
export type ScrollMagicEventLocation = EnumToLiteral<EventLocation>;
export type ScrollMagicEventScrollDirection = EnumToLiteral<ScrollDirection>;

class ScrollMagicEvent implements DispatchableEvent {
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
export default ScrollMagicEvent;
