/**
 * Regression tests for PixelConverter caching behaviour.
 * Converters should only be called when the relevant size actually changes —
 * not on every scroll frame. Scroll only changes position, not size.
 */
import { describe, test, expect, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import ScrollMagic from '../../src/index';

// --- Helpers ---

const waitForFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
const waitForFrames = async (n = 3) => {
	for (let i = 0; i < n; i++) await waitForFrame();
};
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const setup = (opts: { contentHeight?: number; elementTop?: number; elementHeight?: number } = {}) => {
	const { contentHeight = 3000, elementTop = 300, elementHeight = 200 } = opts;
	document.body.style.margin = '0';
	document.body.style.padding = '0';

	const spacer = document.createElement('div');
	spacer.style.height = `${contentHeight}px`;
	spacer.style.position = 'relative';

	const target = document.createElement('div');
	target.style.position = 'absolute';
	target.style.top = `${elementTop}px`;
	target.style.height = `${elementHeight}px`;
	target.style.width = '100%';

	spacer.appendChild(target);
	document.body.appendChild(spacer);
	return { spacer, target };
};

const cleanup = () => {
	document.body.innerHTML = '';
	window.scrollTo(0, 0);
};

// --- Tests ---

describe('PixelConverter caching', () => {
	afterEach(cleanup);

	test('elementStart/elementEnd are not called on scroll when element size is unchanged', async () => {
		await page.viewport(1024, 768);
		// elementTop=300, height=200 — element is visible initially, stays intersecting as we scroll
		const { target } = setup({ elementTop: 300, elementHeight: 200 });

		let elementStartCalls = 0;
		let elementEndCalls = 0;
		const scene = new ScrollMagic({
			element: target,
			elementStart: size => { elementStartCalls++; return 0; },
			elementEnd: size => { elementEndCalls++; return 0; },
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
		const { target } = setup({ elementTop: 300, elementHeight: 200 });

		let elementStartCalls = 0;
		const scene = new ScrollMagic({
			element: target,
			elementStart: size => { elementStartCalls++; return 0; },
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
		const { target } = setup({ elementTop: 300, elementHeight: 900 });

		let triggerStartCalls = 0;
		let triggerEndCalls = 0;
		const scene = new ScrollMagic({
			element: target,
			triggerStart: size => { triggerStartCalls++; return 0; },
			triggerEnd: size => { triggerEndCalls++; return 0; },
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
		const { target } = setup({ elementTop: 300 });

		let triggerStartCalls = 0;
		const scene = new ScrollMagic({
			element: target,
			triggerStart: size => { triggerStartCalls++; return 0; },
		});

		await waitForFrames();
		const callsAfterInit = triggerStartCalls;

		await page.viewport(1024, 500);
		await wait(200); // container resize is debounced at 100ms
		await waitForFrames();

		expect(triggerStartCalls).toBeGreaterThan(callsAfterInit);
		scene.destroy();
	});

	test('elementStart/elementEnd are re-called after modify() even if element size is unchanged', async () => {
		await page.viewport(1024, 768);
		const { target } = setup({ elementTop: 300, elementHeight: 200 });

		const scene = new ScrollMagic({ element: target });
		await waitForFrames();

		let newConverterCalls = 0;
		scene.modify({ elementStart: size => { newConverterCalls++; return size * 0.1; } });
		await waitForFrames();

		expect(newConverterCalls).toBeGreaterThan(0);
		scene.destroy();
	});

	test('containerBounds are recalculated when direction changes via modify()', async () => {
		await page.viewport(1024, 768);
		const { target } = setup({ elementTop: 300, elementHeight: 200 });

		let triggerStartCalls = 0;
		const scene = new ScrollMagic({
			element: target,
			triggerStart: size => { triggerStartCalls++; return 0; },
		});

		await waitForFrames();
		const callsAfterInit = triggerStartCalls;

		scene.modify({ vertical: false });
		await waitForFrames();

		expect(triggerStartCalls).toBeGreaterThan(callsAfterInit);
		scene.destroy();
	});

	test('triggerStart/triggerEnd take effect after modify() — regression for stale containerBoundsCache', async () => {
		// Bug: containerBounds was not rescheduled when trigger options changed via modify(),
		// leaving stale offsetStart/offsetEnd in the cache.
		await page.viewport(1024, 768);
		const { target } = setup({ elementTop: 300, elementHeight: 200 });

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
