import { DispatchableEvent } from './EventDispatcher';
import { Scene } from './Scene';

export enum ScrollMagicEventType {
	Enter = 'enter',
	Leave = 'leave',
	Progress = 'progress',
}
class ScrollMagicEvent implements DispatchableEvent<ScrollMagicEventType> {
	constructor(public readonly type: ScrollMagicEventType, public readonly target: Scene) {}
}
export default ScrollMagicEvent;
