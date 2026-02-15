import { describe, test, expect, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import ScrollMagic from '../../src/index';

// Helper: create a scrollable page with a target element
const setup = (opts: { contentHeight?: number; elementTop?: number; elementHeight?: number } = {}) => {
	const { contentHeight = 3000, elementTop = 1000, elementHeight = 200 } = opts;

	document.body.style.margin = '0';
	document.body.style.padding = '0';

	const spacer = document.createElement('div');
	spacer.style.height = `${contentHeight}px`;
	spacer.style.position = 'relative';

	const target = document.createElement('div');
	target.id = 'target';
	target.style.position = 'absolute';
	target.style.top = `${elementTop}px`;
	target.style.height = `${elementHeight}px`;
	target.style.width = '100%';
	target.style.background = 'red';

	spacer.appendChild(target);
	document.body.appendChild(spacer);

	return { spacer, target };
};

const cleanup = () => {
	document.body.innerHTML = '';
	window.scrollTo(0, 0);
};

const waitForFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
const waitForFrames = async (n = 2) => {
	for (let i = 0; i < n; i++) await waitForFrame();
};

describe('ScrollMagic scroll progress', () => {
	afterEach(cleanup);

	test('fires enter and progress events on scroll', async () => {
		await page.viewport(1024, 768);
		const { target } = setup();

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
		const { target } = setup({ elementTop: 500, elementHeight: 100 });

		const scene = new ScrollMagic({ element: target });

		// Scroll well past the element
		window.scrollTo(0, 2000);
		await waitForFrames(3);

		expect(scene.progress).toBe(1);

		scene.destroy();
	});

	test('progress is 0 before element enters viewport', async () => {
		await page.viewport(1024, 768);
		const { target } = setup({ elementTop: 2000 });

		const scene = new ScrollMagic({ element: target });
		await waitForFrames(3);

		expect(scene.progress).toBe(0);

		scene.destroy();
	});

	test('fires leave event when scrolling past', async () => {
		await page.viewport(1024, 768);
		const { target } = setup({ elementTop: 500, elementHeight: 100 });

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
		const { target } = setup({ elementTop: 500, elementHeight: 100 });

		const events: string[] = [];
		const scene = new ScrollMagic({ element: target });
		scene.on('progress', () => events.push('progress'));

		scene.destroy();

		window.scrollTo(0, 1000);
		await waitForFrames(3);

		expect(events).toHaveLength(0);
	});
});
