/**
 * Manual refresh API: refresh(), refreshAll(), destroyAll().
 * Tests for: position change detection via refresh, class-based changes,
 * chaining, multi-instance refreshAll, destroyed instance exclusion, destroyAll.
 */
import { describe, test, expect, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import ScrollMagic from '../../src/index';
import { cleanup, setupWindow, waitForFrames } from './helpers';

describe('refresh', () => {
	afterEach(cleanup);

	// Note on shift magnitude: position shifts must be small enough that the element stays
	// well within the IntersectionObserver's margin region. If the shift moves the element
	// outside the IO boundary, IO fires automatically and progress updates without refresh(),
	// defeating the test's purpose. With default options (IO margins ≈ 0% on a 768px viewport),
	// the element must stay clearly visible in the viewport after the shift.
	test('refresh() picks up position changes from inline style', async () => {
		await page.viewport(1024, 768);
		// element at visual ~150px after scroll — centered in viewport
		const { target } = setupWindow({ elementTop: 550, elementHeight: 100 });

		const sm = new ScrollMagic({ element: target });
		window.scrollTo(0, 400);
		await waitForFrames();
		const progressBefore = sm.progress;
		expect(progressBefore).toBeGreaterThan(0);

		// small shift (50px) keeps element well within viewport (visual 150px → 100px)
		// ResizeObserver won't fire (size unchanged), IO margins aren't crossed
		target.style.top = '500px';
		await waitForFrames();
		const progressWithoutRefresh = sm.progress;

		sm.refresh();
		await waitForFrames();
		const progressAfterRefresh = sm.progress;

		// element moved closer to top → progress should increase
		expect(progressAfterRefresh).toBeGreaterThan(progressBefore);
		expect(progressAfterRefresh).not.toBe(progressWithoutRefresh);

		sm.destroy();
	});

	test('refresh() picks up class-based position changes', async () => {
		await page.viewport(1024, 768);
		// element at visual ~150px after scroll
		const { target } = setupWindow({ elementTop: 550, elementHeight: 100 });

		// CSS class that shifts position by 50px (keeps element in viewport)
		const style = document.createElement('style');
		style.textContent = '.shifted { top: 500px !important; }';
		document.head.appendChild(style);

		const sm = new ScrollMagic({ element: target });
		window.scrollTo(0, 400);
		await waitForFrames();
		const progressBefore = sm.progress;
		expect(progressBefore).toBeGreaterThan(0);

		target.classList.add('shifted');
		sm.refresh();
		await waitForFrames();

		expect(sm.progress).not.toBe(progressBefore);

		sm.destroy();
		style.remove();
	});

	test('refresh() is chainable', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow();
		const sm = new ScrollMagic({ element: target });
		const result = sm.refresh();
		expect(result).toBe(sm);
		sm.destroy();
	});

	test('refreshAll() updates all active instances', async () => {
		await page.viewport(1024, 768);
		// elements well within viewport after scroll: visual ~150px and ~250px
		const { spacer, target } = setupWindow({ elementTop: 550, elementHeight: 100 });

		const target2 = document.createElement('div');
		target2.style.position = 'absolute';
		target2.style.top = '650px';
		target2.style.height = '100px';
		target2.style.width = '100%';
		spacer.appendChild(target2);

		const scene1 = new ScrollMagic({ element: target });
		const scene2 = new ScrollMagic({ element: target2 });
		window.scrollTo(0, 400);
		await waitForFrames();
		const p1Before = scene1.progress;
		const p2Before = scene2.progress;

		// small shifts (50px each) — stay within viewport
		target.style.top = '500px';
		target2.style.top = '600px';

		ScrollMagic.refreshAll();
		await waitForFrames();

		expect(scene1.progress).not.toBe(p1Before);
		expect(scene2.progress).not.toBe(p2Before);

		scene1.destroy();
		scene2.destroy();
	});

	test('refreshAll() skips disabled instances while refreshing enabled ones', async () => {
		await page.viewport(1024, 768);
		const { spacer, target } = setupWindow({ elementTop: 550, elementHeight: 100 });

		const target2 = document.createElement('div');
		target2.style.position = 'absolute';
		target2.style.top = '650px';
		target2.style.height = '100px';
		target2.style.width = '100%';
		spacer.appendChild(target2);

		const scene1 = new ScrollMagic({ element: target });
		const scene2 = new ScrollMagic({ element: target2 });
		window.scrollTo(0, 400);
		await waitForFrames();
		const p1Before = scene1.progress;
		const p2Before = scene2.progress;

		scene1.disable();

		// small shifts — stay within viewport
		target.style.top = '500px';
		target2.style.top = '600px';

		ScrollMagic.refreshAll();
		await waitForFrames();

		// disabled instance: progress frozen
		expect(scene1.progress).toBe(p1Before);
		// enabled instance: progress updated
		expect(scene2.progress).not.toBe(p2Before);

		scene1.destroy();
		scene2.destroy();
	});

	test('destroyed instances are excluded from refreshAll()', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 550, elementHeight: 100 });

		const sm = new ScrollMagic({ element: target });
		window.scrollTo(0, 400);
		await waitForFrames();
		const progressBefore = sm.progress;

		sm.destroy();

		target.style.top = '500px';
		ScrollMagic.refreshAll();
		await waitForFrames();

		// progress is frozen at whatever it was before destroy
		expect(sm.progress).toBe(progressBefore);
	});

	test('destroyAll() destroys all active instances', async () => {
		await page.viewport(1024, 768);
		const { spacer, target } = setupWindow({ elementTop: 550, elementHeight: 100 });

		const target2 = document.createElement('div');
		target2.style.position = 'absolute';
		target2.style.top = '650px';
		target2.style.height = '100px';
		target2.style.width = '100%';
		spacer.appendChild(target2);

		const scene1 = new ScrollMagic({ element: target });
		const scene2 = new ScrollMagic({ element: target2 });
		window.scrollTo(0, 400);
		await waitForFrames();
		const p1Before = scene1.progress;
		const p2Before = scene2.progress;

		ScrollMagic.destroyAll();

		// scroll should not update progress on destroyed instances
		window.scrollTo(0, 600);
		await waitForFrames();

		expect(scene1.progress).toBe(p1Before);
		expect(scene2.progress).toBe(p2Before);
	});
});
