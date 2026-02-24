import { describe, test, expect } from 'vitest';
import { registerEvent } from '../../src/util/registerEvent';

describe('registerEvent', () => {
	test('listener receives dispatched events', () => {
		const target = document.createElement('div');
		let received = false;
		registerEvent(target, 'click', () => {
			received = true;
		});
		target.dispatchEvent(new Event('click'));
		expect(received).toBe(true);
	});

	test('returned function removes the listener', () => {
		const target = document.createElement('div');
		let callCount = 0;
		const remove = registerEvent(target, 'click', () => {
			callCount++;
		});
		target.dispatchEvent(new Event('click'));
		remove();
		target.dispatchEvent(new Event('click'));
		expect(callCount).toBe(1);
	});

	test('respects listener options', () => {
		const target = document.createElement('div');
		let callCount = 0;
		registerEvent(
			target,
			'click',
			() => {
				callCount++;
			},
			{ once: true }
		);
		target.dispatchEvent(new Event('click'));
		target.dispatchEvent(new Event('click'));
		expect(callCount).toBe(1);
	});
});
