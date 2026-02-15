/**
 * Shared ResizeObserver — uses a single observer instance for all elements,
 * routing entries to per-element callback sets via a WeakMap.
 *
 * After all callbacks for a batch of entries have fired, the RafQueue is
 * flushed so downstream work (ExecutionQueues) executes in the same frame.
 *
 * Safe to call in non-browser environments — returns a no-op cleanup if
 * ResizeObserver is unavailable.
 */
import { rafQueue } from './rafQueue';

type ResizeCallback = () => void;

const callbacks = new WeakMap<Element, Set<ResizeCallback>>();
let observer: ResizeObserver | undefined; // undefined = not yet created, vs null from getObserver = unavailable

const handleResize: ResizeObserverCallback = entries => {
	// Collect all affected callbacks first, then fire — avoids issues if a
	// callback modifies the callback set (e.g. by calling observeResize/cleanup).
	const affected = new Set<ResizeCallback>();
	for (const entry of entries) {
		callbacks.get(entry.target)?.forEach(cb => affected.add(cb));
	}
	affected.forEach(cb => cb());
	rafQueue.flush();
};

const noop = () => {};

/** Returns the shared observer, or null if ResizeObserver is unavailable (SSR). */
const getObserver = (): ResizeObserver | null => {
	if ('undefined' === typeof ResizeObserver) return null;
	if (undefined === observer) {
		observer = new ResizeObserver(handleResize);
	}
	return observer;
};

/**
 * Observe an element for resize. Returns a cleanup function that removes the
 * callback and unobserves the element when no callbacks remain.
 */
export const observeResize = (element: Element, callback: ResizeCallback): (() => void) => {
	const obs = getObserver();
	if (null === obs) return noop;
	let cbs = callbacks.get(element);
	if (undefined === cbs) {
		cbs = new Set();
		callbacks.set(element, cbs);
		obs.observe(element);
	}
	cbs.add(callback);
	return () => {
		const cbs = callbacks.get(element);
		if (undefined === cbs) return;
		cbs.delete(callback);
		if (0 === cbs.size) {
			callbacks.delete(element);
			observer?.unobserve(element);
		}
	};
};
