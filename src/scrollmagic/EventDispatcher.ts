import { Scene } from './Scene';

export enum ScrollMagicEventType {
	Enter = 'enter',
	Leave = 'leave',
	Progress = 'progress',
}
export class ScrollMagicEvent {
	constructor(public readonly target: Scene, public readonly type: ScrollMagicEventType) {}
}

export class ScrollMagicProgressEvent extends ScrollMagicEvent {
	public readonly type = ScrollMagicEventType.Progress;
	constructor(public readonly target: Scene, public readonly progress: number) {
		super(target, ScrollMagicEventType.Progress);
	}
}

type Event = ScrollMagicEvent | ScrollMagicProgressEvent;

type SpecificEvent<T extends ScrollMagicEventType> = Extract<Event, { type: T }>;
export type NarrowDownEvent<T extends ScrollMagicEventType> = SpecificEvent<T> extends never
	? ScrollMagicEvent
	: SpecificEvent<T>;

export type Callback<E extends ScrollMagicEvent = ScrollMagicEvent> = (event: E) => void;
export default class EventDispatcher {
	private callbacks = new Map<ScrollMagicEventType, Callback[]>();
	public addEventListener<T extends ScrollMagicEventType>(type: T, cb: Callback<NarrowDownEvent<T>>): void {
		let list = this.callbacks.get(type);
		if (undefined === list) {
			list = [];
			this.callbacks.set(type, list);
		}
		list.push(cb as Callback);
	}

	public removeEventListener(type: ScrollMagicEventType, cb: Callback): void {
		const list = this.callbacks.get(type);
		if (undefined === list) {
			return;
		}
		const remaining = list.filter(registeredCallback => registeredCallback !== cb);
		this.callbacks.set(type, remaining);
	}

	public dispatchEvent(event: ScrollMagicEvent): void {
		const list = this.callbacks.get(event.type);
		if (undefined === list) {
			return;
		}
		list.forEach(cb => cb(event));
	}
}
