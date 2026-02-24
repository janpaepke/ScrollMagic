/**
 * Element tracking edge cases: resize, DOM mutations, SVG elements.
 * Tests for: layout shifts from element resize, content removal above element, SVG as tracked element.
 */
import { describe, test, expect, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import ScrollMagic from '../../src/index';
import { cleanup, setupWindow, wait, waitForFrames } from './helpers';

// #986: Lazy-loaded images changing layout may not trigger ResizeObserver or bounds recalculation in time.
// Tested by resizing the tracked element after initial scroll (simulates lazy image load).
describe('element resize / layout shifts', () => {
	afterEach(cleanup);

	test('progress recalculates when tracked element changes size', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 300, elementHeight: 200 });
		const sm = new ScrollMagic({ element: target });

		// Scroll and wait for IO to fire and set intersecting=true
		window.scrollTo(0, 200);
		await waitForFrames(3);
		const progressBefore = sm.progress;
		expect(progressBefore).toBeGreaterThan(0);

		// Simulate lazy image loading — element grows taller
		target.style.height = '600px';
		// ResizeObserver fires before next paint; wait generously for it + scheduler flush
		await wait(500);
		await waitForFrames(5);

		// Track size changed, so progress should differ
		expect(sm.progress).not.toBe(progressBefore);

		sm.destroy();
	});
});

// #911: Major DOM mutations (removing large nodes) while scrolled could cause scroll position drift.
// Tested by removing a large block above the tracked element mid-scroll.
describe('DOM mutation', () => {
	afterEach(cleanup);

	test('handles removal of content above tracked element', async () => {
		await page.viewport(1024, 768);
		document.body.style.margin = '0';
		document.body.style.padding = '0';

		const wrapper = document.createElement('div');
		wrapper.style.position = 'relative';

		const aboveBlock = document.createElement('div');
		aboveBlock.style.height = '800px';

		const target = document.createElement('div');
		target.style.height = '200px';
		target.style.width = '100%';
		target.style.background = 'red';

		const belowBlock = document.createElement('div');
		belowBlock.style.height = '2000px';

		wrapper.appendChild(aboveBlock);
		wrapper.appendChild(target);
		wrapper.appendChild(belowBlock);
		document.body.appendChild(wrapper);

		const sm = new ScrollMagic({ element: target });

		// Scroll to see the target
		window.scrollTo(0, 500);
		await waitForFrames(3);
		expect(sm.progress).toBeGreaterThan(0);

		// Remove the 800px block above — target shifts up in layout
		aboveBlock.remove();
		await waitForFrames(5);

		// Should not crash; progress should be a valid number
		expect(sm.progress).toBeGreaterThanOrEqual(0);
		expect(sm.progress).toBeLessThanOrEqual(1);
		expect(Number.isNaN(sm.progress)).toBe(false);

		sm.destroy();
	});
});

// #618, #460: SVG elements may report incorrect bounding boxes in Firefox.
// SVG child elements (<path>, <g>, <use>) as IO targets may behave unexpectedly.
describe('SVG elements', () => {
	afterEach(cleanup);

	test('tracks an SVG element', async () => {
		await page.viewport(1024, 768);
		document.body.style.margin = '0';
		document.body.style.padding = '0';

		const spacer = document.createElement('div');
		spacer.style.height = '3000px';
		spacer.style.position = 'relative';

		const svgNS = 'http://www.w3.org/2000/svg';
		const svg = document.createElementNS(svgNS, 'svg');
		svg.setAttribute('width', '200');
		svg.setAttribute('height', '200');
		svg.style.position = 'absolute';
		svg.style.top = '1000px';

		const rect = document.createElementNS(svgNS, 'rect');
		rect.setAttribute('width', '200');
		rect.setAttribute('height', '200');
		rect.setAttribute('fill', 'blue');
		svg.appendChild(rect);

		spacer.appendChild(svg);
		document.body.appendChild(spacer);

		const events: string[] = [];
		const sm = new ScrollMagic({ element: svg });
		sm.on('enter', () => events.push('enter'));
		sm.on('leave', () => events.push('leave'));

		// Scroll into view
		window.scrollTo(0, 800);
		await waitForFrames(3);
		expect(events).toContain('enter');
		expect(sm.progress).toBeGreaterThan(0);

		// Scroll past
		window.scrollTo(0, 1500);
		await waitForFrames(3);
		expect(sm.progress).toBe(1);

		sm.destroy();
	});
});
