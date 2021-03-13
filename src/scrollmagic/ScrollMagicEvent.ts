import { DispatchableEvent } from './EventDispatcher';
import { ScrollMagic } from './ScrollMagic';

export enum ScrollMagicEventType {
	Enter = 'enter',
	Leave = 'leave',
	Progress = 'progress',
}

export enum ScrollMagicEventScrollDirection {
	Up = 'up',
	Down = 'down',
	Left = 'left',
	Right = 'right',
}
function getDirection(vertical: boolean, forward: boolean) {
	const directions = vertical
		? [ScrollMagicEventScrollDirection.Down, ScrollMagicEventScrollDirection.Up]
		: [ScrollMagicEventScrollDirection.Right, ScrollMagicEventScrollDirection.Left];
	return forward ? directions[0] : directions[1];
}
class ScrollMagicEvent implements DispatchableEvent {
	public readonly direction: ScrollMagicEventScrollDirection;
	constructor(
		public readonly type: ScrollMagicEventType,
		movingForward: boolean,
		public readonly target: ScrollMagic
	) {
		this.direction = getDirection(target.vertical, movingForward);
	}
}
export default ScrollMagicEvent;
