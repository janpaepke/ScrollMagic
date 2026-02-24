/**
 * PixelConverter caching and bounds invalidation.
 * Tests for: converters not re-called on scroll (only on resize), modify() forcing recalculation,
 * direction changes invalidating caches, stale containerBoundsCache after container option changes.
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
		const sm = new ScrollMagic({
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
		sm.destroy();
	});

	test('elementStart/elementEnd are called when element resizes', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 300, elementHeight: 200 });

		let elementStartCalls = 0;
		const sm = new ScrollMagic({
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
		sm.destroy();
	});

	test('containerStart/containerEnd are not called on scroll', async () => {
		await page.viewport(1024, 768);
		// element taller than viewport so containerStart/End returning 0 doesn't cause a no-overlap warning
		const { target } = setupWindow({ elementTop: 300, elementHeight: 900 });

		let containerStartCalls = 0;
		let containerEndCalls = 0;
		const sm = new ScrollMagic({
			element: target,
			containerStart: () => {
				containerStartCalls++;
				return 0;
			},
			containerEnd: () => {
				containerEndCalls++;
				return 0;
			},
		});

		await waitForFrames();
		const callsAfterInit = containerStartCalls + containerEndCalls;

		window.scrollTo(0, 100);
		await waitForFrames();
		window.scrollTo(0, 200);
		await waitForFrames();
		window.scrollTo(0, 300);
		await waitForFrames();

		expect(containerStartCalls + containerEndCalls).toBe(callsAfterInit);
		sm.destroy();
	});

	test('containerStart/containerEnd are called when container resizes', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 300 });

		let containerStartCalls = 0;
		const sm = new ScrollMagic({
			element: target,
			containerStart: () => {
				containerStartCalls++;
				return 0;
			},
		});

		await waitForFrames();
		const callsAfterInit = containerStartCalls;

		await page.viewport(1024, 500);
		await wait(50); // give ResizeObserver a moment to fire
		await waitForFrames();

		expect(containerStartCalls).toBeGreaterThan(callsAfterInit);
		sm.destroy();
	});

	test('elementStart/elementEnd are re-called after modify() even if element size is unchanged', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 300, elementHeight: 200 });

		const sm = new ScrollMagic({ element: target });
		await waitForFrames();

		let newConverterCalls = 0;
		sm.modify({
			elementStart: size => {
				newConverterCalls++;
				return size * 0.1;
			},
		});
		await waitForFrames();

		expect(newConverterCalls).toBeGreaterThan(0);
		sm.destroy();
	});

	test('elementBounds are recalculated when direction changes via modify()', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 300, elementHeight: 200 });

		let elementStartCalls = 0;
		const sm = new ScrollMagic({
			element: target,
			elementStart: () => {
				elementStartCalls++;
				return 0;
			},
		});

		await waitForFrames();
		const callsAfterInit = elementStartCalls;

		sm.modify({ vertical: false });
		await waitForFrames();

		expect(elementStartCalls).toBeGreaterThan(callsAfterInit);
		sm.destroy();
	});

	test('containerBounds are recalculated when direction changes via modify()', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 300, elementHeight: 200 });

		let containerStartCalls = 0;
		const sm = new ScrollMagic({
			element: target,
			containerStart: () => {
				containerStartCalls++;
				return 0;
			},
		});

		await waitForFrames();
		const callsAfterInit = containerStartCalls;

		sm.modify({ vertical: false });
		await waitForFrames();

		expect(containerStartCalls).toBeGreaterThan(callsAfterInit);
		sm.destroy();
	});

	test('containerStart/containerEnd take effect after modify() — stale containerBoundsCache', async () => {
		// Bug: containerBounds was not rescheduled when container options changed via modify(),
		// leaving stale offsetStart/offsetEnd in the cache.
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 300, elementHeight: 200 });

		const sm = new ScrollMagic({ element: target, containerStart: '0%' });
		window.scrollTo(0, 200);
		await waitForFrames();
		const progressBefore = sm.progress;

		sm.modify({ containerStart: '50%' });
		await waitForFrames();
		const progressAfter = sm.progress;

		expect(progressAfter).not.toBe(progressBefore);
		sm.destroy();
	});
});
