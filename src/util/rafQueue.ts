type Flushable = { execute(): void };

/**
 * Batches execution of multiple Flushable items into a single requestAnimationFrame.
 *
 * Items marked dirty via `schedule()` are collected in a Set (deduped) and executed
 * together — either when the rAF fires or when `flush()` is called explicitly.
 *
 * In the hot path (scroll/resize), callers invoke `flush()` directly after dispatching
 * events, so all downstream work executes in the same frame. The rAF serves as a
 * fallback for work scheduled outside of event dispatch (e.g. initial setup, programmatic
 * option changes).
 */
class RafQueue {
	private dirty = new Set<Flushable>();
	private rafId = 0;

	/** Mark an item for execution. Requests a rAF if none is pending. */
	schedule(item: Flushable): void {
		this.dirty.add(item);
		if (0 === this.rafId) {
			this.rafId = requestAnimationFrame(() => {
				this.rafId = 0;
				this.flush();
			});
		}
	}

	/** Remove an item from the dirty set, preventing its execution. */
	unschedule(item: Flushable): void {
		this.dirty.delete(item);
	}

	/** Execute all dirty items immediately and cancel any pending rAF. */
	flush(): void {
		if (0 !== this.rafId) {
			cancelAnimationFrame(this.rafId);
			this.rafId = 0;
		}
		const items = [...this.dirty];
		this.dirty.clear();
		items.forEach(item => item.execute());
	}
}

export const rafQueue = new RafQueue();
