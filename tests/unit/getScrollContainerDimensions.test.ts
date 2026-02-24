import { describe, test, expect } from 'vitest';
import { getScrollContainerDimensions } from '../../src/util/getScrollContainerDimensions';

// NOTE: jsdom's window doesn't pass `instanceof Window`, so window-branch behavior
// (documentElement fallback, visualViewport) is covered by e2e tests.

describe('getScrollContainerDimensions', () => {
	test('returns all four dimension properties for an element', () => {
		const el = document.createElement('div');
		Object.defineProperty(el, 'clientWidth', { value: 400 });
		Object.defineProperty(el, 'clientHeight', { value: 300 });
		Object.defineProperty(el, 'scrollWidth', { value: 800 });
		Object.defineProperty(el, 'scrollHeight', { value: 1200 });
		const dims = getScrollContainerDimensions(el);
		expect(dims).toEqual({
			clientWidth: 400,
			clientHeight: 300,
			scrollWidth: 800,
			scrollHeight: 1200,
		});
	});

	test('does not use visualViewport for element containers', () => {
		const el = document.createElement('div');
		Object.defineProperty(el, 'clientHeight', { value: 300 });
		const dims = getScrollContainerDimensions(el);
		expect(dims.clientHeight).toBe(300);
	});
});
