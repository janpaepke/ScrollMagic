/**
 * Regression tests for bugfixes (not derived from external issue reports).
 */
import { describe, test, expect, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import ScrollMagic from '../../src/index';
import { cleanup, setupContainer, setupWindow, wait, waitForFrames } from './helpers';

// positionCache for non-window containers was initialized to {top:0,left:0} and only updated on
// window scroll/resize events (via subscribeMove). For a container offset from the viewport top,
// the initial progress calculation used containerPosition=0 instead of the actual position.
describe('non-window container position initialization', () => {
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

// PixelConverter caching: converters should only be called when the relevant size actually changes,
// not on every scroll frame.
describe('PixelConverter caching', () => {
	afterEach(cleanup);

	test('elementStart/elementEnd are not called on scroll when element size is unchanged', async () => {
		await page.viewport(1024, 768);
		// elementTop=300, height=200 — element is visible initially, stays intersecting as we scroll
		const { target } = setupWindow({ elementTop: 300, elementHeight: 200 });

		let elementStartCalls = 0;
		let elementEndCalls = 0;
		const scene = new ScrollMagic({
			element: target,
			elementStart: () => {
				elementStartCalls++;
				return 0;
			},
			elementEnd: () => {
				elementEndCalls++;
				return 0;
			},
		});

		await waitForFrames();
		const callsAfterInit = elementStartCalls + elementEndCalls;

		// scroll while element remains intersecting (no resize)
		window.scrollTo(0, 100);
		await waitForFrames();
		window.scrollTo(0, 200);
		await waitForFrames();
		window.scrollTo(0, 250);
		await waitForFrames();

		expect(elementStartCalls + elementEndCalls).toBe(callsAfterInit);
		scene.destroy();
	});

	test('elementStart/elementEnd are called when element resizes', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 300, elementHeight: 200 });

		let elementStartCalls = 0;
		const scene = new ScrollMagic({
			element: target,
			elementStart: () => {
				elementStartCalls++;
				return 0;
			},
		});

		await waitForFrames();
		const callsAfterInit = elementStartCalls;

		target.style.height = '400px';
		await waitForFrames();

		expect(elementStartCalls).toBeGreaterThan(callsAfterInit);
		scene.destroy();
	});

	test('triggerStart/triggerEnd are not called on scroll', async () => {
		await page.viewport(1024, 768);
		// element taller than viewport so triggerStart/End returning 0 doesn't cause a no-overlap warning
		const { target } = setupWindow({ elementTop: 300, elementHeight: 900 });

		let triggerStartCalls = 0;
		let triggerEndCalls = 0;
		const scene = new ScrollMagic({
			element: target,
			triggerStart: () => {
				triggerStartCalls++;
				return 0;
			},
			triggerEnd: () => {
				triggerEndCalls++;
				return 0;
			},
		});

		await waitForFrames();
		const callsAfterInit = triggerStartCalls + triggerEndCalls;

		window.scrollTo(0, 100);
		await waitForFrames();
		window.scrollTo(0, 200);
		await waitForFrames();
		window.scrollTo(0, 300);
		await waitForFrames();

		expect(triggerStartCalls + triggerEndCalls).toBe(callsAfterInit);
		scene.destroy();
	});

	test('triggerStart/triggerEnd are called when container resizes', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 300 });

		let triggerStartCalls = 0;
		const scene = new ScrollMagic({
			element: target,
			triggerStart: () => {
				triggerStartCalls++;
				return 0;
			},
		});

		await waitForFrames();
		const callsAfterInit = triggerStartCalls;

		await page.viewport(1024, 500);
		await wait(50); // give ResizeObserver a moment to fire
		await waitForFrames();

		expect(triggerStartCalls).toBeGreaterThan(callsAfterInit);
		scene.destroy();
	});

	test('elementStart/elementEnd are re-called after modify() even if element size is unchanged', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 300, elementHeight: 200 });

		const scene = new ScrollMagic({ element: target });
		await waitForFrames();

		let newConverterCalls = 0;
		scene.modify({
			elementStart: size => {
				newConverterCalls++;
				return size * 0.1;
			},
		});
		await waitForFrames();

		expect(newConverterCalls).toBeGreaterThan(0);
		scene.destroy();
	});

	test('elementBounds are recalculated when direction changes via modify()', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 300, elementHeight: 200 });

		let elementStartCalls = 0;
		const scene = new ScrollMagic({
			element: target,
			elementStart: () => {
				elementStartCalls++;
				return 0;
			},
		});

		await waitForFrames();
		const callsAfterInit = elementStartCalls;

		scene.modify({ vertical: false });
		await waitForFrames();

		expect(elementStartCalls).toBeGreaterThan(callsAfterInit);
		scene.destroy();
	});

	test('containerBounds are recalculated when direction changes via modify()', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 300, elementHeight: 200 });

		let triggerStartCalls = 0;
		const scene = new ScrollMagic({
			element: target,
			triggerStart: () => {
				triggerStartCalls++;
				return 0;
			},
		});

		await waitForFrames();
		const callsAfterInit = triggerStartCalls;

		scene.modify({ vertical: false });
		await waitForFrames();

		expect(triggerStartCalls).toBeGreaterThan(callsAfterInit);
		scene.destroy();
	});

	test('triggerStart/triggerEnd take effect after modify() — stale containerBoundsCache', async () => {
		// Bug: containerBounds was not rescheduled when trigger options changed via modify(),
		// leaving stale offsetStart/offsetEnd in the cache.
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 300, elementHeight: 200 });

		const scene = new ScrollMagic({ element: target, triggerStart: '0%' });
		window.scrollTo(0, 200);
		await waitForFrames();
		const progressBefore = scene.progress;

		scene.modify({ triggerStart: '50%' });
		await waitForFrames();
		const progressAfter = scene.progress;

		expect(progressAfter).not.toBe(progressBefore);
		scene.destroy();
	});
});
