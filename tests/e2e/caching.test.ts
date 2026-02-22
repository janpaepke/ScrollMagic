/**
 * PixelConverter caching and bounds invalidation.
 * Tests for: converters not re-called on scroll (only on resize), modify() forcing recalculation,
 * direction changes invalidating caches, stale containerBoundsCache after trigger option changes.
 */
import { describe, test, expect, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import ScrollMagic from '../../src/index';
import { cleanup, setupWindow, wait, waitForFrames } from './helpers';

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
