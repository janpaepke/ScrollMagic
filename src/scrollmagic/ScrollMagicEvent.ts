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
class ScrollMagicEvent implements DispatchableEvent {
	public readonly direction: ScrollMagicEventScrollDirection;
	constructor(
		public readonly type: ScrollMagicEventType,
		movingForward: boolean,
		public readonly target: ScrollMagic
	) {
		this.direction = movingForward
			? ScrollMagicEventScrollDirection.Forward
			: ScrollMagicEventScrollDirection.Reverse;
	}
}
export default ScrollMagicEvent;
