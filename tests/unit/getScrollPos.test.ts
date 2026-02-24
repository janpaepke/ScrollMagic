import { describe, test, expect } from 'vitest';
import { getScrollPos } from '../../src/util/getScrollPos';

// NOTE: jsdom's window doesn't pass `instanceof Window`, so the window branch
// of getScrollPos is covered by e2e tests. Here we test the element branch.

describe('getScrollPos', () => {
	test('returns scroll position for element', () => {
		const el = document.createElement('div');
		Object.defineProperty(el, 'scrollTop', { value: 150, writable: true });
		Object.defineProperty(el, 'scrollLeft', { value: 75, writable: true });
		const pos = getScrollPos(el);
		expect(pos).toEqual({ left: 75, top: 150 });
	});

	test('returns { left: 0, top: 0 } for element with no scroll', () => {
		const el = document.createElement('div');
		const pos = getScrollPos(el);
		expect(pos).toEqual({ left: 0, top: 0 });
	});
});
