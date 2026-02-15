import { isUndefined } from './util/typeguards';

type EventType = string;
export interface DispatchableEvent {
	readonly target: unknown;
	readonly type: EventType;
}

type Callback<E extends DispatchableEvent> = (event: E) => void;
export class EventDispatcher {
	private callbacks = new Map<string, Callback<any>[]>();

	// adds a listener to the dispatcher. returns a function to reverse the effect.
	public addEventListener<T extends DispatchableEvent>(type: T['type'], cb: Callback<T>): () => void {
		let list = this.callbacks.get(type);
		if (isUndefined(list)) {
			list = [];
			this.callbacks.set(type, list);
		}
		list.push(cb);
		return () => this.removeEventListener(type, cb);
	}

	// removes a listner from the dispatcher
	public removeEventListener<T extends DispatchableEvent>(type: T['type'], cb: Callback<T>): void {
		const list = this.callbacks.get(type);
		if (isUndefined(list)) {
			return;
		}
		const remaining = list.filter(registeredCallback => registeredCallback !== cb);
		this.callbacks.set(type, remaining);
	}

	// dispatches an event... DUH!
	public dispatchEvent(event: DispatchableEvent): void {
		const list = this.callbacks.get(event.type);
		if (isUndefined(list)) {
			return;
		}
		list.forEach(cb => cb(event));
	}
}
