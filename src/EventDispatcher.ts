type EventType = string;
export interface DispatchableEvent {
	readonly target: unknown;
	readonly type: EventType;
}

type Callback<E extends DispatchableEvent> = (event: E) => void;
export class EventDispatcher<E extends DispatchableEvent = DispatchableEvent> {
	private callbacks = new Map<string, Callback<E>[]>();

	// adds a listener to the dispatcher. returns a function to reverse the effect.
	public addEventListener(type: E['type'], cb: Callback<E>): () => void {
		let list = this.callbacks.get(type);
		if (!list) {
			list = [];
			this.callbacks.set(type, list);
		}
		list.push(cb);
		return () => this.removeEventListener(type, cb);
	}

	// removes a listener from the dispatcher
	public removeEventListener(type: E['type'], cb: Callback<E>): void {
		const list = this.callbacks.get(type);
		if (!list) {
			return;
		}
		const index = list.indexOf(cb);
		if (index !== -1) {
			list.splice(index, 1);
		}
		if (0 === list.length) {
			this.callbacks.delete(type);
		}
	}

	// dispatches an event
	public dispatchEvent(event: E): void {
		this.callbacks.get(event.type)?.forEach(cb => cb(event));
	}
}
