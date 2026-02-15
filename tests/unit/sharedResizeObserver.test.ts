import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { rafQueue } from '../../src/util/rafQueue';
import { observeResize } from '../../src/util/sharedResizeObserver';

// Mock ResizeObserver — the shared observer creates it lazily, so this runs before first use.
const observeMock = vi.fn();
const unobserveMock = vi.fn();
let roCallback: ResizeObserverCallback;

class MockResizeObserver {
	constructor(cb: ResizeObserverCallback) {
		roCallback = cb;
	}
	observe = observeMock;
	unobserve = unobserveMock;
	disconnect = vi.fn();
}

vi.stubGlobal('ResizeObserver', MockResizeObserver);

const makeElement = () => document.createElement('div');

// Helper to simulate a resize entry for an element
const simulateResize = (...elements: Element[]) => {
	const entries = elements.map(target => ({ target }) as ResizeObserverEntry);
	roCallback(entries, {} as ResizeObserver);
};

describe('sharedResizeObserver', () => {
	beforeEach(() => {
		vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);
		vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
		observeMock.mockClear();
		unobserveMock.mockClear();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('observeResize starts observing the element', () => {
		const el = makeElement();
		const cleanup = observeResize(el, vi.fn());
		expect(observeMock).toHaveBeenCalledWith(el);
		cleanup();
	});

	test('multiple callbacks for same element: element observed only once', () => {
		const el = makeElement();
		const c1 = observeResize(el, vi.fn());
		const c2 = observeResize(el, vi.fn());
		expect(observeMock).toHaveBeenCalledTimes(1);
		c1();
		c2();
	});

	test('all callbacks for an element fire on resize', () => {
		const el = makeElement();
		const cbA = vi.fn();
		const cbB = vi.fn();
		const c1 = observeResize(el, cbA);
		const c2 = observeResize(el, cbB);
		simulateResize(el);
		expect(cbA).toHaveBeenCalledOnce();
		expect(cbB).toHaveBeenCalledOnce();
		c1();
		c2();
	});

	test('cleanup removes callback; element unobserved when last callback removed', () => {
		const el = makeElement();
		const cbA = vi.fn();
		const cbB = vi.fn();
		const cleanupA = observeResize(el, cbA);
		const cleanupB = observeResize(el, cbB);

		cleanupA();
		expect(unobserveMock).not.toHaveBeenCalled(); // still has cbB

		simulateResize(el);
		expect(cbA).not.toHaveBeenCalled(); // removed
		expect(cbB).toHaveBeenCalledOnce(); // still active

		cleanupB();
		expect(unobserveMock).toHaveBeenCalledWith(el); // last callback removed
	});

	test('cleanup is idempotent', () => {
		const el = makeElement();
		const cleanup = observeResize(el, vi.fn());
		cleanup();
		expect(unobserveMock).toHaveBeenCalledTimes(1);
		cleanup(); // second call should be no-op
		expect(unobserveMock).toHaveBeenCalledTimes(1);
	});

	test('rafQueue.flush is called after all callbacks', () => {
		const flushSpy = vi.spyOn(rafQueue, 'flush');
		const el = makeElement();
		const cb = vi.fn();
		const cleanup = observeResize(el, cb);
		simulateResize(el);
		expect(cb).toHaveBeenCalledOnce();
		expect(flushSpy).toHaveBeenCalledOnce();
		cleanup();
	});

	test('resize entries for multiple elements route correctly', () => {
		const el1 = makeElement();
		const el2 = makeElement();
		const cb1 = vi.fn();
		const cb2 = vi.fn();
		const c1 = observeResize(el1, cb1);
		const c2 = observeResize(el2, cb2);

		simulateResize(el1);
		expect(cb1).toHaveBeenCalledOnce();
		expect(cb2).not.toHaveBeenCalled();

		cb1.mockClear();
		simulateResize(el1, el2);
		expect(cb1).toHaveBeenCalledOnce();
		expect(cb2).toHaveBeenCalledOnce();

		c1();
		c2();
	});
});
