import { describe, test, expect } from 'vitest';
import {
	numberToPercString,
	unitStringToPixelConverter,
	toPixelConverter,
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
