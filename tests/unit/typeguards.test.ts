import { describe, test, expect } from 'vitest';
import { isWindow, isHTMLElement, isSVGElement } from '../../src/util/typeguards';

describe('isWindow', () => {
	// NOTE: jsdom's window does not pass `instanceof Window`, so the positive case
	// is covered by e2e tests in a real browser. Here we only test rejection.
	test('returns false for non-window values', () => {
		expect(isWindow(null)).toBe(false);
		expect(isWindow(undefined)).toBe(false);
		expect(isWindow(document.createElement('div'))).toBe(false);
		expect(isWindow({})).toBe(false);
	});
});

describe('isHTMLElement', () => {
	test('returns true for HTML elements', () => {
		expect(isHTMLElement(document.createElement('div'))).toBe(true);
		expect(isHTMLElement(document.createElement('span'))).toBe(true);
		expect(isHTMLElement(document.body)).toBe(true);
	});

	test('returns false for non-HTML values', () => {
		expect(isHTMLElement(null)).toBe(false);
		expect(isHTMLElement(window)).toBe(false);
		expect(isHTMLElement({})).toBe(false);
		expect(isHTMLElement(document.createElementNS('http://www.w3.org/2000/svg', 'rect'))).toBe(false);
	});
});

describe('isSVGElement', () => {
	test('returns true for SVG elements', () => {
		expect(isSVGElement(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))).toBe(true);
		expect(isSVGElement(document.createElementNS('http://www.w3.org/2000/svg', 'rect'))).toBe(true);
	});

	test('returns false for non-SVG values', () => {
		expect(isSVGElement(null)).toBe(false);
		expect(isSVGElement(document.createElement('div'))).toBe(false);
		expect(isSVGElement(window)).toBe(false);
	});
});
