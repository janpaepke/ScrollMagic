import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	numberToPercString,
	unitStringToPixelConverter,
	toPixelConverter,
	selectorToSingleElement,
	toSvgOrHtmlElement,
	toValidContainer,
	skipNull,
} from '../../src/util/transformers';

describe('numberToPercString', () => {
	test('converts decimal to percentage string', () => {
		expect(numberToPercString(0.5, 2)).toBe('50.00%');
		expect(numberToPercString(1, 0)).toBe('100%');
		expect(numberToPercString(0, 2)).toBe('0.00%');
	});

	test('handles negative values', () => {
		expect(numberToPercString(-0.25, 1)).toBe('-25.0%');
	});
});

describe('unitStringToPixelConverter', () => {
	test('parses px values', () => {
		const conv = unitStringToPixelConverter('20px');
		expect(conv(100)).toBe(20);
		expect(conv(500)).toBe(20); // px is absolute
	});

	test('parses percentage values', () => {
		const conv = unitStringToPixelConverter('50%');
		expect(conv(200)).toBe(100);
		expect(conv(400)).toBe(200);
	});

	test('parses negative values', () => {
		const conv = unitStringToPixelConverter('-10px');
		expect(conv(100)).toBe(-10);
	});

	test('throws on invalid string', () => {
		expect(() => unitStringToPixelConverter('abc')).toThrow();
	});
});

describe('toPixelConverter', () => {
	test('wraps number as constant converter', () => {
		const conv = toPixelConverter(42);
		expect(conv(0)).toBe(42);
		expect(conv(999)).toBe(42);
	});

	test('parses unit string', () => {
		const conv = toPixelConverter('25%');
		expect(conv(200)).toBe(50);
	});

	test('handles "here" shorthand (0%)', () => {
		const conv = toPixelConverter('here');
		expect(conv(200)).toBe(0);
		expect(conv(400)).toBe(0);
	});

	test('handles "center" shorthand (50%)', () => {
		const conv = toPixelConverter('center');
		expect(conv(200)).toBe(100);
		expect(conv(400)).toBe(200);
	});

	test('handles "opposite" shorthand (100%)', () => {
		const conv = toPixelConverter('opposite');
		expect(conv(200)).toBe(200);
		expect(conv(400)).toBe(400);
	});

	test('accepts valid function', () => {
		const fn = (size: number) => size * 2;
		const conv = toPixelConverter(fn);
		expect(conv(50)).toBe(100);
	});

	test('throws on function that does not return number', () => {
		const fn = () => 'nope' as unknown as number;
		expect(() => toPixelConverter(fn)).toThrow('Function must return a number');
	});

	test('throws on function that throws', () => {
		const fn = () => {
			throw new Error('boom');
		};
		expect(() => toPixelConverter(fn)).toThrow('Unsupported value type');
	});
});

describe('selectorToSingleElement', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('returns the first matching element', () => {
		const div = document.createElement('div');
		div.className = 'target';
		document.body.appendChild(div);
		expect(selectorToSingleElement('.target')).toBe(div);
	});

	test('throws when no element matches', () => {
		expect(() => selectorToSingleElement('.nonexistent')).toThrow('No element found for selector .nonexistent');
	});

	test('warns when selector matches multiple elements', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		document.body.innerHTML = '<div class="multi"></div><div class="multi"></div><div class="multi"></div>';
		const result = selectorToSingleElement('.multi');
		expect(result).toBe(document.querySelector('.multi'));
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining('matched 3 elements, using only the first')
		);
	});

	test('does not warn when selector matches exactly one element', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		document.body.innerHTML = '<div id="unique"></div>';
		selectorToSingleElement('#unique');
		expect(warnSpy).not.toHaveBeenCalled();
	});
});

describe('toSvgOrHtmlElement', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('accepts an HTMLElement that is in the document', () => {
		const div = document.createElement('div');
		document.body.appendChild(div);
		expect(toSvgOrHtmlElement(div)).toBe(div);
	});

	test('accepts an SVGElement that is in the document', () => {
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		document.body.appendChild(svg);
		expect(toSvgOrHtmlElement(svg)).toBe(svg);
	});

	test('resolves a CSS selector to the matching element', () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const div = document.createElement('div');
		div.id = 'target';
		document.body.appendChild(div);
		expect(toSvgOrHtmlElement('#target')).toBe(div);
	});

	test('throws for an element not in the document', () => {
		const detached = document.createElement('div');
		expect(() => toSvgOrHtmlElement(detached)).toThrow('Invalid element');
	});

	test('throws for a non-HTML/SVG element', () => {
		// Comment nodes, etc. — anything not HTML or SVG
		const comment = document.createComment('hi') as unknown as Element;
		expect(() => toSvgOrHtmlElement(comment)).toThrow('Invalid element');
	});
});

describe('toValidContainer', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
	});

	// NOTE: window pass-through relies on `instanceof Window` which fails in jsdom.
	// That path is covered by e2e tests.

	test('accepts an HTMLElement in the document', () => {
		const div = document.createElement('div');
		document.body.appendChild(div);
		expect(toValidContainer(div)).toBe(div);
	});

	test('rejects an SVGElement as container', () => {
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		document.body.appendChild(svg);
		expect(() => toValidContainer(svg)).toThrow("Can't use SVG as container");
	});

	test('resolves a CSS selector to the container element', () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const div = document.createElement('div');
		div.id = 'container';
		document.body.appendChild(div);
		expect(toValidContainer('#container')).toBe(div);
	});
});

describe('skipNull', () => {
	test('calls function when value is not null', () => {
		const double = skipNull((n: number) => n * 2);
		expect(double(5)).toBe(10);
	});

	test('returns null when value is null', () => {
		const double = skipNull((n: number) => n * 2);
		expect(double(null)).toBeNull();
	});
});
