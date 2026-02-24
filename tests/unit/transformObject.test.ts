import { describe, test, expect } from 'vitest';
import { transformObject } from '../../src/util/transformObject';

describe('transformObject', () => {
	test('transforms values using the provided function', () => {
		const input = { a: 1, b: 2, c: 3 };
		const result = transformObject(input, ([key, value]) => [key, value * 10]);
		expect(result).toEqual({ a: 10, b: 20, c: 30 });
	});

	test('transforms keys using the provided function', () => {
		const input = { a: 1, b: 2 };
		const result = transformObject(input, ([key, value]) => [`${String(key)}_new`, value]);
		expect(result).toEqual({ a_new: 1, b_new: 2 });
	});

	test('returns empty object for empty input', () => {
		const result = transformObject({}, ([key, value]) => [key, value]);
		expect(result).toEqual({});
	});

	test('can transform both keys and values simultaneously', () => {
		const input = { x: 'hello', y: 'world' };
		const result = transformObject(input, ([key, value]) => [
			String(key).toUpperCase(),
			String(value).toUpperCase(),
		]);
		expect(result).toEqual({ X: 'HELLO', Y: 'WORLD' });
	});
});
