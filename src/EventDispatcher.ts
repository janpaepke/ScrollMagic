const noop = () => {};
type EventType = string;
export interface DispatchableEvent {
	readonly target: unknown;
	readonly type: EventType;
}

/** Options for event listener registration. */
export type ListenerOptions = {
	/** If `true`, the listener is automatically removed after its first invocation. */
	once?: boolean;
	/** An {@link AbortSignal} — when aborted, the listener is automatically removed. Matches the DOM `addEventListener` pattern. */
	signal?: AbortSignal;
};
type Callback<E extends DispatchableEvent> = (event: E) => void;
type ListenerEntry<E extends DispatchableEvent> = { cb: Callback<E>; options: ListenerOptions };

export class EventDispatcher<E extends DispatchableEvent = DispatchableEvent> {
	private listeners = new Map<string, Set<ListenerEntry<E>>>();

	// adds a listener to the dispatcher. returns a function to reverse the effect.
	public addEventListener(type: E['type'], cb: Callback<E>, options: ListenerOptions = {}): () => void {
		// Match DOM spec: if signal already aborted, don't register
		if (options.signal?.aborted) {
			return noop;
		}
		let set = this.listeners.get(type);
		if (!set) {
			set = new Set();
			this.listeners.set(type, set);
		}
		// fresh object per registration — Set identity keeps duplicate registrations of the same callback distinct
		const entry: ListenerEntry<E> = { cb, options };
		set.add(entry);
		const remove = () => this.removeEntry(type, entry);
		if (options.signal) {
			options.signal.addEventListener('abort', remove, { once: true });
		}
		return remove;
	}

	// removes a listener from the dispatcher
	public removeEventListener(type: E['type'], cb: Callback<E>): void {
		const set = this.listeners.get(type);
		if (!set) {
			return;
		}
		for (const entry of set) {
			if (entry.cb === cb) {
				this.removeEntry(type, entry);
				break;
			}
		}
	}

	// dispatches an event
	public dispatchEvent(event: E): void {
		const set = this.listeners.get(event.type);
		if (!set) {
			return;
		}
		// iterate a copy so listeners added during dispatch don't fire in the same cycle
		for (const entry of [...set]) {
			if (entry.options.once) {
				this.removeEntry(event.type, entry);
			}
			entry.cb(event);
		}
	}

	private removeEntry(type: string, entry: ListenerEntry<E>): void {
		const set = this.listeners.get(type);
		if (!set) {
			return;
		}
		set.delete(entry);
		if (0 === set.size) {
			this.listeners.delete(type);
		}
	}
}
