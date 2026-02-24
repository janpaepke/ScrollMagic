import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { throttleRaf } from '../../src/util/throttleRaf';

describe('throttleRaf', () => {
	let rafCallbacks: Map<number, FrameRequestCallback>;
	let nextId: number;

	beforeEach(() => {
		rafCallbacks = new Map();
		nextId = 1;
		vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
			const id = nextId++;
			rafCallbacks.set(id, cb);
			return id;
		});
		vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation((id) => {
			rafCallbacks.delete(id);
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	const flushRaf = () => {
		const pending = [...rafCallbacks.values()];
		rafCallbacks.clear();
		for (const cb of pending) {
			cb(performance.now());
		}
	};

	test('does not call function synchronously', () => {
		const fn = vi.fn();
		const throttled = throttleRaf(fn);
		throttled();
		expect(fn).not.toHaveBeenCalled();
	});

	test('calls function on next animation frame', () => {
		const fn = vi.fn();
		const throttled = throttleRaf(fn);
		throttled();
		flushRaf();
		expect(fn).toHaveBeenCalledOnce();
	});

	test('collapses multiple calls into a single execution per frame', () => {
		const fn = vi.fn();
		const throttled = throttleRaf(fn);
		throttled();
		throttled();
		throttled();
		flushRaf();
		expect(fn).toHaveBeenCalledOnce();
	});

	test('can schedule again after frame fires', () => {
		const fn = vi.fn();
		const throttled = throttleRaf(fn);
		throttled();
		flushRaf();
		throttled();
		flushRaf();
		expect(fn).toHaveBeenCalledTimes(2);
	});

	test('cancel prevents pending execution', () => {
		const fn = vi.fn();
		const throttled = throttleRaf(fn);
		throttled();
		throttled.cancel();
		flushRaf();
		expect(fn).not.toHaveBeenCalled();
	});

	test('can schedule again after cancel', () => {
		const fn = vi.fn();
		const throttled = throttleRaf(fn);
		throttled();
		throttled.cancel();
		throttled();
		flushRaf();
		expect(fn).toHaveBeenCalledOnce();
	});

	test('passes arguments from the first call in the batch', () => {
		const fn = vi.fn();
		const throttled = throttleRaf(fn);
		throttled('first');
		throttled('second'); // dropped — already scheduled
		flushRaf();
		expect(fn).toHaveBeenCalledWith('first');
	});

	test('preserves this context', () => {
		const context = { name: 'ctx', called: false };
		const throttled = throttleRaf(function (this: typeof context) {
			this.called = true;
		});
		throttled.call(context);
		flushRaf();
		expect(context.called).toBe(true);
	});
});
