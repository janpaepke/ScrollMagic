import { describe, test, expect, vi, beforeEach } from 'vitest';
import { rafQueue } from '../../src/util/rafQueue';

const flushable = (fn = vi.fn()) => ({ execute: fn });

describe('Scheduler', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	test('schedule requests a single rAF regardless of item count', () => {
		const spy = vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);
		const a = flushable();
		const b = flushable();
		rafQueue.schedule(a);
		rafQueue.schedule(b);
		expect(spy).toHaveBeenCalledTimes(1);
		// cleanup
		rafQueue.flush();
	});

	test('flush executes all dirty items', () => {
		const a = flushable();
		const b = flushable();
		vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);
		rafQueue.schedule(a);
		rafQueue.schedule(b);
		rafQueue.flush();
		expect(a.execute).toHaveBeenCalledOnce();
		expect(b.execute).toHaveBeenCalledOnce();
	});

	test('flush cancels pending rAF', () => {
		const cancelSpy = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
		vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(42);
		rafQueue.schedule(flushable());
		rafQueue.flush();
		expect(cancelSpy).toHaveBeenCalledWith(42);
	});

	test('after flush, dirty set is empty — subsequent rAF is a no-op', () => {
		const a = flushable();
		vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);
		rafQueue.schedule(a);
		rafQueue.flush();
		a.execute.mockClear();
		// simulate rAF callback (would have been cancelled, but let's verify no-op)
		rafQueue.flush();
		expect(a.execute).not.toHaveBeenCalled();
	});

	test('unschedule prevents execution', () => {
		const a = flushable();
		vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);
		rafQueue.schedule(a);
		rafQueue.unschedule(a);
		rafQueue.flush();
		expect(a.execute).not.toHaveBeenCalled();
	});

	test('multiple schedule calls for same item execute it only once', () => {
		const a = flushable();
		vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);
		rafQueue.schedule(a);
		rafQueue.schedule(a);
		rafQueue.schedule(a);
		rafQueue.flush();
		expect(a.execute).toHaveBeenCalledOnce();
	});

	test('items scheduled during flush get a new rAF', () => {
		const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);
		const b = flushable();
		const a = flushable(vi.fn(() => rafQueue.schedule(b)));
		rafQueue.schedule(a);
		rafSpy.mockClear();
		rafQueue.flush();
		expect(a.execute).toHaveBeenCalledOnce();
		// b was scheduled during flush — should NOT have been executed in the same flush
		expect(b.execute).not.toHaveBeenCalled();
		// but a new rAF should have been requested
		expect(rafSpy).toHaveBeenCalledTimes(1);
		// cleanup
		rafQueue.flush();
	});

	test('rAF callback triggers flush', () => {
		let rafCallback: FrameRequestCallback | undefined;
		vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
			rafCallback = cb;
			return 1;
		});
		const a = flushable();
		rafQueue.schedule(a);
		expect(a.execute).not.toHaveBeenCalled();
		rafCallback!(0);
		expect(a.execute).toHaveBeenCalledOnce();
	});
});
