/**
 * Scroll container behavior: non-window scroll parents, container edge cases, viewport resize.
 * Tests for: div containers, position:fixed containers, container position initialization,
 * zero-size containers, viewport resize (mobile address bar).
 */
import { describe, test, expect, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import ScrollMagic from '../../src/index';
import type { ScrollMagicEvent } from '../../src/index';
import { cleanup, setupContainer, setupWindow, wait, waitForFrames } from './helpers';

// #905, #1004: Non-window scroll containers with overflow:scroll.
describe('non-window scroll containers', () => {
	afterEach(cleanup);

	test('enter/leave/progress events fire in scrollable div container', async () => {
		await page.viewport(1024, 768);
		const { container, target } = setupContainer();

		const events: string[] = [];
		const scene = new ScrollMagic({ element: target, scrollParent: container });
		scene.on('enter', () => events.push('enter'));
		scene.on('progress', () => events.push('progress'));
		scene.on('leave', () => events.push('leave'));

		container.scrollTop = 700;
		await waitForFrames(3);
		expect(events).toContain('enter');
		expect(scene.progress).toBeGreaterThan(0);

		container.scrollTop = 1500;
		await waitForFrames(3);
		expect(events).toContain('leave');
		expect(scene.progress).toBe(1);

		scene.destroy();
	});

	test('scroll direction is correct in non-window container', async () => {
		await page.viewport(1024, 768);
		const { container, target } = setupContainer();

		const directions: Array<{ type: string; direction: string }> = [];
		const scene = new ScrollMagic({ element: target, scrollParent: container });
		scene.on('enter', (e: ScrollMagicEvent) => directions.push({ type: 'enter', direction: e.direction }));
		scene.on('leave', (e: ScrollMagicEvent) => directions.push({ type: 'leave', direction: e.direction }));

		// Scroll forward past element
		container.scrollTop = 1500;
		await waitForFrames(3);

		const forwardEnter = directions.find(d => 'enter' === d.type && 'forward' === d.direction);
		const forwardLeave = directions.find(d => 'leave' === d.type && 'forward' === d.direction);
		expect(forwardEnter).toBeDefined();
		expect(forwardLeave).toBeDefined();

		directions.length = 0;

		// Scroll backward past element
		container.scrollTop = 0;
		await waitForFrames(3);

		const reverseEnter = directions.find(d => 'enter' === d.type && 'reverse' === d.direction);
		const reverseLeave = directions.find(d => 'leave' === d.type && 'reverse' === d.direction);
		expect(reverseEnter).toBeDefined();
		expect(reverseLeave).toBeDefined();

		scene.destroy();
	});

	// #905: position:fixed containers as IO root.
	test('works with position:fixed scroll container', async () => {
		await page.viewport(1024, 768);
		const { container, target } = setupContainer({
			containerCss: {
				position: 'fixed',
				top: '0',
				left: '0',
				width: '100%',
			},
		});

		const scene = new ScrollMagic({ element: target, scrollParent: container });

		container.scrollTop = 700;
		await waitForFrames(3);
		expect(scene.progress).toBeGreaterThan(0);

		container.scrollTop = 1500;
		await waitForFrames(3);
		expect(scene.progress).toBe(1);

		container.scrollTop = 0;
		await waitForFrames(3);
		expect(scene.progress).toBe(0);

		scene.destroy();
	});
});

// positionCache for non-window containers was initialized to {top:0,left:0} and only updated on
// window scroll/resize events (via subscribeMove). For a container offset from the viewport top,
// the initial progress calculation used containerPosition=0 instead of the actual position.
describe('container position initialization', () => {
	afterEach(cleanup);

	test('correct initial progress when container is offset from viewport top', async () => {
		await page.viewport(1024, 768);
		document.body.style.margin = '0';
		document.body.style.padding = '0';

		// Push the container down so it's not at y=0
		const spacer = document.createElement('div');
		spacer.style.height = '300px';
		document.body.appendChild(spacer);

		// Container is now at y=300, height=400; element at contentTop=800, height=100
		const { container, target } = setupContainer({ elementTop: 800, elementHeight: 100 });

		const scene = new ScrollMagic({ element: target, scrollParent: container });
		await waitForFrames(3); // let initialization settle

		// Scroll without triggering any window scroll/resize (which would fix positionCache via subscribeMove)
		container.scrollTop = 600;
		await waitForFrames(5);

		// With fix: containerPosition=300, containerStart=700, elementStart=500, passed=200, progress=0.4
		// Without fix: containerPosition=0, containerStart=400, elementStart=500, passed=-100, progress=0
		expect(scene.progress).toBeGreaterThan(0);

		scene.destroy();
	});
});

// When container clientSize is 0 (hidden/collapsed), updateProgress() would compute wrong values:
// containerOffset collapsed to 0 and the calculation produced a different (incorrect) progress,
// firing spurious events. updateViewportObserver() also passed broken 0% margins to the observer.
describe('zero-size scroll container', () => {
	afterEach(cleanup);

	test('no events fire and progress stays frozen when container height becomes zero', async () => {
		await page.viewport(1024, 768);
		const { container, target } = setupContainer({ elementTop: 800, elementHeight: 100 });

		const scene = new ScrollMagic({ element: target, scrollParent: container });
		await waitForFrames(3);

		container.scrollTop = 850;
		await waitForFrames(5);

		const progressBefore = scene.progress;
		expect(progressBefore).toBeGreaterThan(0); // sanity check

		const events: string[] = [];
		scene.on('enter', () => events.push('enter'));
		scene.on('leave', () => events.push('leave'));
		scene.on('progress', () => events.push('progress'));

		// Collapse the container
		container.style.height = '0px';
		await wait(50); // allow ResizeObserver to fire
		await waitForFrames(5);

		// Without fix: updateProgress() ran with containerSize=0, computed a different value
		// and fired a spurious 'progress' event.
		expect(Number.isNaN(scene.progress)).toBe(false);
		expect(isFinite(scene.progress)).toBe(true);
		expect(events).toHaveLength(0);
		expect(scene.progress).toBe(progressBefore);

		scene.destroy();
	});
});

// #883, #372: Mobile address bar show/hide changes viewport dimensions.
// Tested by shrinking the viewport programmatically (simulates address bar appearing).
describe('viewport resize', () => {
	afterEach(cleanup);

	test('progress updates after viewport height change', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 600, elementHeight: 200 });

		const scene = new ScrollMagic({ element: target });

		// Scroll so element is partially in view
		window.scrollTo(0, 500);
		await waitForFrames(3);
		const progressBefore = scene.progress;
		expect(progressBefore).toBeGreaterThan(0);
		expect(progressBefore).toBeLessThan(1);

		// Shrink viewport (simulates mobile address bar appearing)
		await page.viewport(1024, 400);
		await wait(50); // give ResizeObserver / window resize event a moment to fire
		await waitForFrames(5);

		// Progress should have changed since viewport size affects the tracking calculation
		expect(scene.progress).not.toBe(progressBefore);

		scene.destroy();
	});
});
