type EventType = string;
export interface DispatchableEvent<T> {
	readonly type: T;
	readonly target: any;
}

export type Callback<T extends EventType> = (event: DispatchableEvent<T>) => void;
export default class EventDispatcher {
	private callbacks = new Map<string, Callback<any>[]>();

	// adds a listener to the dispatcher. returns a function to reverse the effect.
	public addEventListener<T extends EventType>(type: T, cb: Callback<T>): () => void {
		let list = this.callbacks.get(type);
		if (undefined === list) {
			list = [];
			this.callbacks.set(type, list);
		}
		list.push(cb);
		return () => this.removeEventListener(type, cb);
	}

	// removes a listner from the dispatcher
	public removeEventListener<T extends EventType>(type: T, cb: Callback<T>): void {
		const list = this.callbacks.get(type);
		if (undefined === list) {
			return;
		}
		const remaining = list.filter(registeredCallback => registeredCallback !== cb);
		this.callbacks.set(type, remaining);
	}

	// dispatches an event... DUH!
	public dispatchEvent(event: DispatchableEvent<EventType>): void {
		const list = this.callbacks.get(event.type);
		if (undefined === list) {
			return;
		}
		list.forEach(cb => cb(event));
	}
}
