import { describe, test, expect, vi, afterEach } from 'vitest';
import { sanitizeProperties } from '../../src/util/sanitizeProperties';

describe('sanitizeProperties', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	const defaults = { name: '', age: 0, active: false };

	test('keeps properties that exist in defaults', () => {
		const result = sanitizeProperties({ name: 'Alice', age: 30 }, defaults);
		expect(result).toEqual({ name: 'Alice', age: 30 });
	});

	test('removes properties not in defaults', () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const result = sanitizeProperties({ name: 'Alice', unknown: 'value' } as never, defaults);
		expect(result).toEqual({ name: 'Alice' });
		expect('unknown' in result).toBe(false);
	});

	test('warns about unknown properties in dev mode', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		sanitizeProperties({ name: 'Alice', foo: 1, bar: 2 } as never, defaults);
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('foo'));
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('bar'));
	});

	test('returns empty object when all properties are unknown', () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const result = sanitizeProperties({ x: 1 } as never, defaults);
		expect(result).toEqual({});
	});

	test('returns empty object for empty input', () => {
		const result = sanitizeProperties({} as never, defaults);
		expect(result).toEqual({});
	});
});
