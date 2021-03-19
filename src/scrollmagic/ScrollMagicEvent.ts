import { DispatchableEvent } from './EventDispatcher';
import { ScrollMagic } from './ScrollMagic';

export enum ScrollMagicEventType {
	Enter = 'enter',
	Leave = 'leave',
	Progress = 'progress',
}

export enum ScrollMagicEventScrollDirection {
	Forward = 'forward',
	Reverse = 'reverse',
}

export enum ScrollMagicEventLocation {
	Start = 'start',
	Inside = 'inside',
	End = 'end',
}

class ScrollMagicEvent implements DispatchableEvent {
	public readonly direction: ScrollMagicEventScrollDirection;
	public readonly location: ScrollMagicEventLocation;
	constructor(
		public readonly type: ScrollMagicEventType,
		movingForward: boolean,
		public readonly target: ScrollMagic
	) {
		this.location = (() => {
			if (ScrollMagicEventType.Progress === type) {
				return ScrollMagicEventLocation.Inside;
			}
			if (
				(ScrollMagicEventType.Enter === type && movingForward) ||
				(ScrollMagicEventType.Leave === type && !movingForward)
			) {
				return ScrollMagicEventLocation.Start;
			}
			return ScrollMagicEventLocation.End;
		})();
		this.direction = movingForward
			? ScrollMagicEventScrollDirection.Forward
			: ScrollMagicEventScrollDirection.Reverse;
	}
}
export default ScrollMagicEvent;
