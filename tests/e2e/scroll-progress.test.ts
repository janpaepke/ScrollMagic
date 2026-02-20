import { describe, test, expect, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import ScrollMagic from '../../src/index';
import { cleanup, setupWindow, waitForFrames } from './helpers';

describe('ScrollMagic scroll progress', () => {
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
