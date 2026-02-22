/**
 * Core scroll progress tracking and event behavior.
 * Tests for: progress 0→1 lifecycle, enter/leave/progress events, event direction,
 * fast scrolling, programmatic scroll jumps, scroll state initialization, destroy.
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
		const scene = new ScrollMagic({ element: target });
		scene.on('enter', () => events.push('enter'));
		scene.on('progress', () => events.push('progress'));
		scene.on('leave', () => events.push('leave'));

		// Scroll to a position where the element should be intersecting
		window.scrollTo(0, 600);
		await waitForFrames(3);

		expect(events).toContain('enter');
		expect(events).toContain('progress');
		expect(scene.progress).toBeGreaterThan(0);

		scene.destroy();
	});

	test('progress reaches 1 when fully scrolled past', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });

		const scene = new ScrollMagic({ element: target });

		// Scroll well past the element
		window.scrollTo(0, 2000);
		await waitForFrames(3);

		expect(scene.progress).toBe(1);

		scene.destroy();
	});

	test('progress is 0 before element enters viewport', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 2000 });

		const scene = new ScrollMagic({ element: target });
		await waitForFrames(3);

		expect(scene.progress).toBe(0);

		scene.destroy();
	});

	test('fires leave event when scrolling past', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });

		const events: string[] = [];
		const scene = new ScrollMagic({ element: target });
		scene.on('leave', () => events.push('leave'));

		window.scrollTo(0, 2000);
		await waitForFrames(3);

		expect(events).toContain('leave');

		scene.destroy();
	});

	test('destroy stops event processing', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });

		const events: string[] = [];
		const scene = new ScrollMagic({ element: target });
		scene.on('progress', () => events.push('progress'));

		scene.destroy();

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
		const scene = new ScrollMagic({ element: target });

		// Instant scroll well past element
		window.scrollTo(0, 2500);
		await waitForFrames(3);
		expect(scene.progress).toBe(1);

		// Instant scroll back to top — element now below viewport
		window.scrollTo(0, 0);
		await waitForFrames(3);
		expect(scene.progress).toBe(0);

		scene.destroy();
	});

	test('all enter/leave events fire during instant scroll through', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });

		const events: string[] = [];
		const scene = new ScrollMagic({ element: target });
		scene.on('enter', () => events.push('enter'));
		scene.on('leave', () => events.push('leave'));

		// Single scroll that jumps completely past the element
		window.scrollTo(0, 2000);
		await waitForFrames(3);

		expect(events).toContain('enter');
		expect(events).toContain('leave');
		expect(scene.progress).toBe(1);

		scene.destroy();
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
		const scene = new ScrollMagic({ element: target });
		await waitForFrames(3);

		expect(scene.progress).toBe(1);

		scene.destroy();
	});

	test('correct initial progress when element is partially visible on creation', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 400 });

		// Scroll to a position where element is partially visible
		window.scrollTo(0, 500);
		await waitForFrames(3);

		const scene = new ScrollMagic({ element: target });
		await waitForFrames(3);

		expect(scene.progress).toBeGreaterThan(0);
		expect(scene.progress).toBeLessThan(1);

		scene.destroy();
	});

	test('fires enter event when created at position where element is visible', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 300, elementHeight: 200 });

		// Scroll so element is in view
		window.scrollTo(0, 200);
		await waitForFrames(3);

		const events: string[] = [];
		const scene = new ScrollMagic({ element: target });
		scene.on('enter', () => events.push('enter'));
		scene.on('progress', () => events.push('progress'));
		await waitForFrames(3);

		expect(events).toContain('enter');
		expect(events).toContain('progress');

		scene.destroy();
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
		const scene = new ScrollMagic({ element: target });
		scene.on('enter', (e: ScrollMagicEvent) => enterDirections.push(e.direction));
		scene.on('leave', (e: ScrollMagicEvent) => leaveDirections.push(e.direction));

		window.scrollTo(0, 2000);
		await waitForFrames(3);

		expect(enterDirections).toContain('forward');
		expect(leaveDirections).toContain('forward');

		scene.destroy();
	});

	test('direction is reverse when scrolling back up past element', async () => {
		await page.viewport(1024, 768);
		// Element below viewport when scrolled to 0, so reverse scroll exits fully
		const { target } = setupWindow({ elementTop: 1500, elementHeight: 100 });

		const scene = new ScrollMagic({ element: target });

		// First scroll past
		window.scrollTo(0, 2500);
		await waitForFrames(3);
		expect(scene.progress).toBe(1);

		const enterDirections: string[] = [];
		const leaveDirections: string[] = [];
		scene.on('enter', (e: ScrollMagicEvent) => enterDirections.push(e.direction));
		scene.on('leave', (e: ScrollMagicEvent) => leaveDirections.push(e.direction));

		// Scroll back to top — element now below viewport
		window.scrollTo(0, 0);
		await waitForFrames(3);

		expect(enterDirections).toContain('reverse');
		expect(leaveDirections).toContain('reverse');

		scene.destroy();
	});
});

// #397: Browser find (Cmd+F) triggers scroll-to-element — verify progress after programmatic scrolls.
describe('programmatic scroll jumps', () => {
	afterEach(cleanup);

	test('progress correct after multiple programmatic scrollTo jumps', async () => {
		await page.viewport(1024, 768);
		// Element below viewport when at scroll=0
		const { target } = setupWindow({ elementTop: 1500, elementHeight: 200 });
		const scene = new ScrollMagic({ element: target });

		// Jump to where element is partially visible
		window.scrollTo(0, 1200);
		await waitForFrames(3);
		expect(scene.progress).toBeGreaterThan(0);
		expect(scene.progress).toBeLessThan(1);

		// Jump far past
		window.scrollTo(0, 2500);
		await waitForFrames(3);
		expect(scene.progress).toBe(1);

		// Jump back to before element (element below viewport)
		window.scrollTo(0, 0);
		await waitForFrames(3);
		expect(scene.progress).toBe(0);

		// Jump directly into element again
		window.scrollTo(0, 1300);
		await waitForFrames(3);
		expect(scene.progress).toBeGreaterThan(0);

		scene.destroy();
	});
});
