import { describe, test, expect } from 'vitest';
import { ScrollMagicError, ScrollMagicInternalError } from '../../src/ScrollMagicError';

describe('ScrollMagicError', () => {
	test('has correct name', () => {
		const err = new ScrollMagicError('test');
		expect(err.name).toBe('ScrollMagicError');
	});

	test('is instanceof Error', () => {
		const err = new ScrollMagicError('test');
		expect(err).toBeInstanceOf(Error);
		expect(err).toBeInstanceOf(ScrollMagicError);
	});

	test('has correct message', () => {
		const err = new ScrollMagicError('something broke');
		expect(err.message).toBe('something broke');
	});

	test('supports cause option', () => {
		const cause = new Error('root');
		const err = new ScrollMagicError('wrapped', { cause });
		expect(err.cause).toBe(cause);
	});

	test('has Symbol.toStringTag', () => {
		const err = new ScrollMagicError('test');
		expect(Object.prototype.toString.call(err)).toBe('[object ScrollMagicError]');
	});
});

describe('ScrollMagicInternalError', () => {
	test('has correct name', () => {
		const err = new ScrollMagicInternalError('oops');
		expect(err.name).toBe('ScrollMagicInternalError');
	});

	test('prepends Internal Error to message', () => {
		const err = new ScrollMagicInternalError('oops');
		expect(err.message).toBe('Internal Error: oops');
	});

	test('is instanceof both error classes', () => {
		const err = new ScrollMagicInternalError('oops');
		expect(err).toBeInstanceOf(Error);
		expect(err).toBeInstanceOf(ScrollMagicError);
		expect(err).toBeInstanceOf(ScrollMagicInternalError);
	});

	test('distinguishable from ScrollMagicError via instanceof', () => {
		const regular = new ScrollMagicError('a');
		const internal = new ScrollMagicInternalError('b');
		expect(regular).not.toBeInstanceOf(ScrollMagicInternalError);
		expect(internal).toBeInstanceOf(ScrollMagicError);
	});
});
