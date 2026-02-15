import { describe, test, expect, vi } from 'vitest';
import { debounce } from '../../src/util/debounce';

describe('debounce', () => {
	test('delays execution', () => {
		vi.useFakeTimers();
		const fn = vi.fn();
		const debounced = debounce(fn, 100);
		debounced();
		expect(fn).not.toHaveBeenCalled();
		vi.advanceTimersByTime(100);
		expect(fn).toHaveBeenCalledOnce();
		vi.useRealTimers();
	});

	test('resets timer on repeated calls', () => {
		vi.useFakeTimers();
		const fn = vi.fn();
		const debounced = debounce(fn, 100);
		debounced();
		vi.advanceTimersByTime(80);
		debounced(); // reset
		vi.advanceTimersByTime(80);
		expect(fn).not.toHaveBeenCalled();
		vi.advanceTimersByTime(20);
		expect(fn).toHaveBeenCalledOnce();
		vi.useRealTimers();
	});

	test('passes arguments to original function', () => {
		vi.useFakeTimers();
		const fn = vi.fn();
		const debounced = debounce(fn, 50);
		debounced('a', 'b');
		vi.advanceTimersByTime(50);
		expect(fn).toHaveBeenCalledWith('a', 'b');
		vi.useRealTimers();
	});

	test('cancel prevents execution', () => {
		vi.useFakeTimers();
		const fn = vi.fn();
		const debounced = debounce(fn, 100);
		debounced();
		debounced.cancel();
		vi.advanceTimersByTime(200);
		expect(fn).not.toHaveBeenCalled();
		vi.useRealTimers();
	});
});
