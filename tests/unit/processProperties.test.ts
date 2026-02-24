import { describe, test, expect } from 'vitest';
import { processProperties } from '../../src/util/processProperties';
import { ScrollMagicError } from '../../src/ScrollMagicError';

describe('processProperties', () => {
	test('applies processor to matching property', () => {
		const result = processProperties({ count: '5' }, { count: (v: string) => parseInt(v, 10) });
		expect(result).toEqual({ count: 5 });
	});

	test('passes through properties without a processor', () => {
		const result = processProperties({ a: 1, b: 2 }, { a: (v: number) => v * 10 });
		expect(result).toEqual({ a: 10, b: 2 });
	});

	test('throws ScrollMagicError when processor fails', () => {
		const processors = {
			val: () => {
				throw new Error('nope');
			},
		};
		expect(() => processProperties({ val: 'x' }, processors)).toThrow(ScrollMagicError);
	});

	test('error message includes property name and value', () => {
		const processors = {
			myProp: () => {
				throw new Error('nope');
			},
		};
		expect(() => processProperties({ myProp: 'bad' }, processors)).toThrow(/Invalid value bad for myProp/);
	});

	test('appends original message when processor throws ScrollMagicError', () => {
		const processors = {
			val: () => {
				throw new ScrollMagicError('must be positive');
			},
		};
		expect(() => processProperties({ val: -1 }, processors)).toThrow(/must be positive/);
	});

	test('uses custom error message formatter when provided', () => {
		const processors = {
			x: () => {
				throw new Error('boom');
			},
		};
		const formatter = (value: unknown, prop: unknown) => `Broken: ${String(prop)}=${String(value)}.`;
		expect(() => processProperties({ x: 42 }, processors, formatter)).toThrow('Broken: x=42.');
	});

	test('chains original error as cause', () => {
		const original = new Error('root cause');
		const processors = {
			x: () => {
				throw original;
			},
		};
		try {
			processProperties({ x: 1 }, processors);
			expect.unreachable();
		} catch (e) {
			expect(e).toBeInstanceOf(ScrollMagicError);
			expect((e as ScrollMagicError).cause).toBe(original);
		}
	});
});
