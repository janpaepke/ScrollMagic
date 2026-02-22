/**
 * Scroll velocity: per-container px/s computation exposed via ScrollMagic getter.
 * Tests for: non-zero during scroll, sign (forward/backward), staleness decay,
 * disabled/destroyed state, callback access via e.target, horizontal axis.
 */
import { describe, test, expect, afterEach, vi } from 'vitest';
import { page } from 'vitest/browser';
import ScrollMagic from '../../src/index';
import { cleanup, setupWindow, wait, waitForFrames } from './helpers';

describe('scrollVelocity', () => {
	afterEach(cleanup);

	test('non-zero during scroll', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 400 });

		const scene = new ScrollMagic({ element: target });
		await waitForFrames(3); // let initial setup complete

		let velocityDuringScroll = 0;
		scene.on('progress', () => {
			velocityDuringScroll = scene.scrollVelocity;
		});

		window.scrollTo(0, 600);
		await waitForFrames(3);

		expect(velocityDuringScroll).not.toBe(0);

		scene.destroy();
	});

	test('positive when scrolling forward', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 400 });

		const scene = new ScrollMagic({ element: target });
		await waitForFrames(3);

		let velocityDuringScroll = 0;
		scene.on('progress', () => {
			velocityDuringScroll = scene.scrollVelocity;
		});

		window.scrollTo(0, 600);
		await waitForFrames(3);

		expect(velocityDuringScroll).toBeGreaterThan(0);

		scene.destroy();
	});

	test('negative when scrolling backward', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 1500, elementHeight: 400 });

		const scene = new ScrollMagic({ element: target });

		// First scroll past the element and let it settle
		window.scrollTo(0, 2500);
		await waitForFrames(3);
		expect(scene.progress).toBe(1);

		let velocityOnReturn = 0;
		scene.on('progress', () => {
			velocityOnReturn = scene.scrollVelocity;
		});

		// Scroll back to top — element now below viewport, progress returns to 0
		window.scrollTo(0, 0);
		await waitForFrames(3);

		expect(scene.progress).toBe(0);
		expect(velocityOnReturn).toBeLessThan(0);

		scene.destroy();
	});

	test('returns 0 after scrolling stops (staleness decay)', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 400 });

		const scene = new ScrollMagic({ element: target });

		window.scrollTo(0, 600);
		await waitForFrames(3);

		// Wait past the 100ms staleness threshold
		await wait(200);

		expect(scene.scrollVelocity).toBe(0);

		scene.destroy();
	});

	test('returns 0 when disabled', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 400 });

		const scene = new ScrollMagic({ element: target });

		window.scrollTo(0, 600);
		await waitForFrames(3);

		scene.disable();
		expect(scene.scrollVelocity).toBe(0);

		scene.destroy();
	});

	test('returns 0 after destroy (no warning)', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 400 });

		const scene = new ScrollMagic({ element: target });

		window.scrollTo(0, 600);
		await waitForFrames(3);

		scene.destroy();

		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		expect(scene.scrollVelocity).toBe(0);
		expect(warnSpy).not.toHaveBeenCalled();
		warnSpy.mockRestore();
	});

	test('positive for horizontal scroll with vertical: false', async () => {
		await page.viewport(1024, 768);
		document.body.style.margin = '0';
		document.body.style.padding = '0';
		const spacer = document.createElement('div');
		spacer.style.width = '5000px';
		spacer.style.height = '768px';
		spacer.style.position = 'relative';
		const target = document.createElement('div');
		target.style.position = 'absolute';
		target.style.left = '1500px';
		target.style.width = '400px';
		target.style.height = '100%';
		spacer.appendChild(target);
		document.body.appendChild(spacer);

		const scene = new ScrollMagic({ element: target, vertical: false });
		await waitForFrames(3);
		expect(scene.progress).toBe(0);

		window.scrollTo(600, 0);
		await waitForFrames(3);

		// Check velocity directly — axis projection picks x, not y
		expect(scene.scrollVelocity).toBeGreaterThan(0);
		expect(scene.progress).toBeGreaterThan(0);

		scene.destroy();
	});

	test('accessible via e.target.scrollVelocity in callbacks', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 400 });

		const scene = new ScrollMagic({ element: target });
		await waitForFrames(3);

		let eventTargetVelocity = 0;
		let directVelocity = 0;
		scene.on('progress', e => {
			eventTargetVelocity = e.target.scrollVelocity;
			directVelocity = scene.scrollVelocity;
		});

		window.scrollTo(0, 600);
		await waitForFrames(3);

		expect(eventTargetVelocity).toBe(directVelocity);
		expect(eventTargetVelocity).not.toBe(0);

		scene.destroy();
	});
});
