/**
 * Core scroll progress tracking and event behavior.
 * Tests for: progress 0→1 lifecycle, enter/leave/progress events, event direction,
 * fast scrolling, programmatic scroll jumps, scroll state initialization, destroy,
 * on() with { once: true }.
 */
import { describe, test, expect, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import ScrollMagic from '../../src/index';
import type { ScrollMagicEvent } from '../../src/index';
import { cleanup, setupWindow, waitForFrames } from './helpers';

describe('progress lifecycle', () => {
	afterEach(cleanup);

	test('fires enter and progress events on scroll', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow();

		const events: string[] = [];
		const sm = new ScrollMagic({ element: target });
		sm.on('enter', () => events.push('enter'));
		sm.on('progress', () => events.push('progress'));
		sm.on('leave', () => events.push('leave'));

		// Scroll to a position where the element should be intersecting
		window.scrollTo(0, 600);
		await waitForFrames(3);

		expect(events).toContain('enter');
		expect(events).toContain('progress');
		expect(sm.progress).toBeGreaterThan(0);

		sm.destroy();
	});

	test('progress reaches 1 when fully scrolled past', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });

		const sm = new ScrollMagic({ element: target });

		// Scroll well past the element
		window.scrollTo(0, 2000);
		await waitForFrames(3);

		expect(sm.progress).toBe(1);

		sm.destroy();
	});

	test('progress is 0 before element enters viewport', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 2000 });

		const sm = new ScrollMagic({ element: target });
		await waitForFrames(3);

		expect(sm.progress).toBe(0);

		sm.destroy();
	});

	test('fires leave event when scrolling past', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });

		const events: string[] = [];
		const sm = new ScrollMagic({ element: target });
		sm.on('leave', () => events.push('leave'));

		window.scrollTo(0, 2000);
		await waitForFrames(3);

		expect(events).toContain('leave');

		sm.destroy();
	});

	test('destroy stops event processing', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });

		const events: string[] = [];
		const sm = new ScrollMagic({ element: target });
		sm.on('progress', () => events.push('progress'));

		sm.destroy();

		window.scrollTo(0, 1000);
		await waitForFrames(3);

		expect(events).toHaveLength(0);
	});
});

// #633: Fast scrolling could skip intermediate IO callbacks — elements scrolled past entirely in one frame.
describe('fast scrolling', () => {
	afterEach(cleanup);

	test('progress is correct after instant scroll past element and back', async () => {
		await page.viewport(1024, 768);
		// Element at 1500px — well below 768px viewport when scrolled to 0
		const { target } = setupWindow({ elementTop: 1500, elementHeight: 100 });
		const sm = new ScrollMagic({ element: target });

		// Instant scroll well past element
		window.scrollTo(0, 2500);
		await waitForFrames(3);
		expect(sm.progress).toBe(1);

		// Instant scroll back to top — element now below viewport
		window.scrollTo(0, 0);
		await waitForFrames(3);
		expect(sm.progress).toBe(0);

		sm.destroy();
	});

	test('all enter/leave events fire during instant scroll through', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });

		const events: string[] = [];
		const sm = new ScrollMagic({ element: target });
		sm.on('enter', () => events.push('enter'));
		sm.on('leave', () => events.push('leave'));

		// Single scroll that jumps completely past the element
		window.scrollTo(0, 2000);
		await waitForFrames(3);

		expect(events).toContain('enter');
		expect(events).toContain('leave');
		expect(sm.progress).toBe(1);

		sm.destroy();
	});
});

// #630, #596: Browser scroll restoration — instances created at non-zero scroll positions.
describe('scroll state initialization', () => {
	afterEach(cleanup);

	test('correct initial progress when instance created at non-zero scroll', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });

		// Scroll past element BEFORE creating instance
		window.scrollTo(0, 2000);
		await waitForFrames(3);

		// Now create instance — should detect current position
		const sm = new ScrollMagic({ element: target });
		await waitForFrames(3);

		expect(sm.progress).toBe(1);

		sm.destroy();
	});

	test('correct initial progress when element is partially visible on creation', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 400 });

		// Scroll to a position where element is partially visible
		window.scrollTo(0, 500);
		await waitForFrames(3);

		const sm = new ScrollMagic({ element: target });
		await waitForFrames(3);

		expect(sm.progress).toBeGreaterThan(0);
		expect(sm.progress).toBeLessThan(1);

		sm.destroy();
	});

	test('fires enter event when created at position where element is visible', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 300, elementHeight: 200 });

		// Scroll so element is in view
		window.scrollTo(0, 200);
		await waitForFrames(3);

		const events: string[] = [];
		const sm = new ScrollMagic({ element: target });
		sm.on('enter', () => events.push('enter'));
		sm.on('progress', () => events.push('progress'));
		await waitForFrames(3);

		expect(events).toContain('enter');
		expect(events).toContain('progress');

		sm.destroy();
	});
});

// #948: scrollDirection may be incorrect if no scroll has occurred yet.
describe('event direction', () => {
	afterEach(cleanup);

	test('direction is forward when element scrolled past from above', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });

		const enterDirections: string[] = [];
		const leaveDirections: string[] = [];
		const sm = new ScrollMagic({ element: target });
		sm.on('enter', (e: ScrollMagicEvent) => enterDirections.push(e.direction));
		sm.on('leave', (e: ScrollMagicEvent) => leaveDirections.push(e.direction));

		window.scrollTo(0, 2000);
		await waitForFrames(3);

		expect(enterDirections).toContain('forward');
		expect(leaveDirections).toContain('forward');

		sm.destroy();
	});

	test('direction is reverse when scrolling back up past element', async () => {
		await page.viewport(1024, 768);
		// Element below viewport when scrolled to 0, so reverse scroll exits fully
		const { target } = setupWindow({ elementTop: 1500, elementHeight: 100 });

		const sm = new ScrollMagic({ element: target });

		// First scroll past
		window.scrollTo(0, 2500);
		await waitForFrames(3);
		expect(sm.progress).toBe(1);

		const enterDirections: string[] = [];
		const leaveDirections: string[] = [];
		sm.on('enter', (e: ScrollMagicEvent) => enterDirections.push(e.direction));
		sm.on('leave', (e: ScrollMagicEvent) => leaveDirections.push(e.direction));

		// Scroll back to top — element now below viewport
		window.scrollTo(0, 0);
		await waitForFrames(3);

		expect(enterDirections).toContain('reverse');
		expect(leaveDirections).toContain('reverse');

		sm.destroy();
	});
});

describe('on with { once: true }', () => {
	afterEach(cleanup);

	test('once listener fires exactly once then auto-removes', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });

		let enterCount = 0;
		const sm = new ScrollMagic({ element: target });
		sm.on('enter', () => enterCount++, { once: true });

		// Scroll forward past element → enter fires
		window.scrollTo(0, 2000);
		await waitForFrames(3);
		expect(enterCount).toBe(1);

		// Scroll back to top → element leaves, then scroll past again
		window.scrollTo(0, 0);
		await waitForFrames(3);
		window.scrollTo(0, 2000);
		await waitForFrames(3);

		// Still 1 — listener was auto-removed after first fire
		expect(enterCount).toBe(1);

		sm.destroy();
	});

	test('off() cancels a once listener before it fires', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });

		let enterCount = 0;
		const handler = () => enterCount++;
		const sm = new ScrollMagic({ element: target });
		sm.on('enter', handler, { once: true });
		sm.off('enter', handler);

		window.scrollTo(0, 2000);
		await waitForFrames(3);

		expect(enterCount).toBe(0);

		sm.destroy();
	});

	test('on with { once: true } is chainable', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow();
		const sm = new ScrollMagic({ element: target });
		const result = sm.on('enter', () => {}, { once: true });
		expect(result).toBe(sm);
		sm.destroy();
	});

	test('once on different event types works independently', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });

		let enterCount = 0;
		let leaveCount = 0;
		const sm = new ScrollMagic({ element: target });
		sm.on('enter', () => enterCount++, { once: true });
		sm.on('leave', () => leaveCount++, { once: true });

		// Scroll forward past → enter + leave fire
		window.scrollTo(0, 2000);
		await waitForFrames(3);
		expect(enterCount).toBe(1);
		expect(leaveCount).toBe(1);

		// Scroll back and forward again → neither fires again
		window.scrollTo(0, 0);
		await waitForFrames(3);
		window.scrollTo(0, 2000);
		await waitForFrames(3);

		expect(enterCount).toBe(1);
		expect(leaveCount).toBe(1);

		sm.destroy();
	});

	test('subscribe with { once: true } fires once and returns working unsubscribe', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });

		let enterCount = 0;
		const sm = new ScrollMagic({ element: target });
		const unsub = sm.subscribe('enter', () => enterCount++, { once: true });
		expect(typeof unsub).toBe('function');

		// Scroll forward past element → enter fires
		window.scrollTo(0, 2000);
		await waitForFrames(3);
		expect(enterCount).toBe(1);

		// Scroll back and forward again → auto-removed, doesn't fire
		window.scrollTo(0, 0);
		await waitForFrames(3);
		window.scrollTo(0, 2000);
		await waitForFrames(3);
		expect(enterCount).toBe(1);

		sm.destroy();
	});

	test('subscribe with { once: true } can be cancelled via unsubscribe before firing', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });

		let enterCount = 0;
		const sm = new ScrollMagic({ element: target });
		const unsub = sm.subscribe('enter', () => enterCount++, { once: true });
		unsub(); // cancel before it fires

		window.scrollTo(0, 2000);
		await waitForFrames(3);
		expect(enterCount).toBe(0);

		sm.destroy();
	});
});

// #397: Browser find (Cmd+F) triggers scroll-to-element — verify progress after programmatic scrolls.
describe('programmatic scroll jumps', () => {
	afterEach(cleanup);

	test('progress correct after multiple programmatic scrollTo jumps', async () => {
		await page.viewport(1024, 768);
		// Element below viewport when at scroll=0
		const { target } = setupWindow({ elementTop: 1500, elementHeight: 200 });
		const sm = new ScrollMagic({ element: target });

		// Jump to where element is partially visible
		window.scrollTo(0, 1200);
		await waitForFrames(3);
		expect(sm.progress).toBeGreaterThan(0);
		expect(sm.progress).toBeLessThan(1);

		// Jump far past
		window.scrollTo(0, 2500);
		await waitForFrames(3);
		expect(sm.progress).toBe(1);

		// Jump back to before element (element below viewport)
		window.scrollTo(0, 0);
		await waitForFrames(3);
		expect(sm.progress).toBe(0);

		// Jump directly into element again
		window.scrollTo(0, 1300);
		await waitForFrames(3);
		expect(sm.progress).toBeGreaterThan(0);

		sm.destroy();
	});
});
