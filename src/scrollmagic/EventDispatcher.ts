export enum ScrollMagicEventType {
	Enter = 'enter',
	Leave = 'leave',
}

type Callback = (event: ScrollMagicEvent) => void;

export class ScrollMagicEvent {
	constructor(public readonly type: ScrollMagicEventType) {}
}

export default class EventDispatcher {
	private callbacks = new Map<ScrollMagicEventType, Callback[]>();
	public addEventListener(type: ScrollMagicEventType, cb: Callback): void {
		let list = this.callbacks.get(type);
		if (undefined === list) {
			list = [];
			this.callbacks.set(type, list);
		}
		list.push(cb);
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
