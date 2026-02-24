import { describe, test, expect } from 'vitest';
import { ScrollMagicEvent, EventType, EventLocation, ScrollDirection } from '../../src/ScrollMagicEvent';
import type { ScrollMagic } from '../../src/ScrollMagic';

// minimal stub — only used as the `target` reference
const fakeTarget = {} as ScrollMagic;

describe('ScrollMagicEvent', () => {
	describe('location', () => {
		test('enter while scrolling forward → start', () => {
			const event = new ScrollMagicEvent(fakeTarget, EventType.Enter, true);
			expect(event.location).toBe('start');
		});

		test('enter while scrolling reverse → end', () => {
			const event = new ScrollMagicEvent(fakeTarget, EventType.Enter, false);
			expect(event.location).toBe('end');
		});

		test('leave while scrolling forward → end', () => {
			const event = new ScrollMagicEvent(fakeTarget, EventType.Leave, true);
			expect(event.location).toBe('end');
		});

		test('leave while scrolling reverse → start', () => {
			const event = new ScrollMagicEvent(fakeTarget, EventType.Leave, false);
			expect(event.location).toBe('start');
		});

		test('progress is always inside', () => {
			expect(new ScrollMagicEvent(fakeTarget, EventType.Progress, true).location).toBe('inside');
			expect(new ScrollMagicEvent(fakeTarget, EventType.Progress, false).location).toBe('inside');
		});
	});

	describe('direction', () => {
		test('forward when scrolling forward', () => {
			const event = new ScrollMagicEvent(fakeTarget, EventType.Enter, true);
			expect(event.direction).toBe('forward');
		});

		test('reverse when scrolling reverse', () => {
			const event = new ScrollMagicEvent(fakeTarget, EventType.Enter, false);
			expect(event.direction).toBe('reverse');
		});
	});

	test('preserves target and type', () => {
		const event = new ScrollMagicEvent(fakeTarget, EventType.Progress, true);
		expect(event.target).toBe(fakeTarget);
		expect(event.type).toBe('progress');
	});

	test('enum values match their string literals', () => {
		expect(EventType.Enter).toBe('enter');
		expect(EventType.Leave).toBe('leave');
		expect(EventType.Progress).toBe('progress');
		expect(EventLocation.Start).toBe('start');
		expect(EventLocation.Inside).toBe('inside');
		expect(EventLocation.End).toBe('end');
		expect(ScrollDirection.Forward).toBe('forward');
		expect(ScrollDirection.Reverse).toBe('reverse');
	});
});
