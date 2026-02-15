import { describe, test, expect } from 'vitest';
import { pickDifferencesFlat } from '../../src/util/pickDifferencesFlat';

describe('pickDifferencesFlat', () => {
	test('returns only changed properties', () => {
		const full = { a: 1, b: 2, c: 3 };
		const part = { a: 1, b: 99 };
		expect(pickDifferencesFlat(part, full)).toEqual({ b: 99 });
	});

	test('returns empty object when nothing changed', () => {
		const full = { a: 1, b: 2 };
		const part = { a: 1, b: 2 };
		expect(pickDifferencesFlat(part, full)).toEqual({});
	});

	test('returns all properties when everything changed', () => {
		const full = { a: 1, b: 2 };
		const part = { a: 10, b: 20 };
		expect(pickDifferencesFlat(part, full)).toEqual({ a: 10, b: 20 });
	});

	test('uses strict equality (not deep)', () => {
		const obj = { x: 1 };
		const full = { a: obj };
		const part = { a: { x: 1 } }; // different reference, same content
		expect(pickDifferencesFlat(part, full)).toEqual({ a: { x: 1 } });
	});

	test('handles empty partial', () => {
		expect(pickDifferencesFlat({}, { a: 1 })).toEqual({});
	});
});
