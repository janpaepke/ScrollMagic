/**
 * Edge case tests derived from v2 bug reports that could also affect v3.
 * Each describe block references the original issue numbers and concerns.
 * Cases that can't be tested here are documented in UNTESTED-EDGE-CASES.md.
 */
import { describe, test, expect, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import ScrollMagic from '../../src/index';
import type { ScrollMagicEvent } from '../../src/index';

// --- Helpers ---

const waitForFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
const waitForFrames = async (n = 2) => {
	for (let i = 0; i < n; i++) await waitForFrame();
};
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Standard setup: scrollable page with a positioned target element (window scroll) */
const setupWindow = (opts: { contentHeight?: number; elementTop?: number; elementHeight?: number } = {}) => {
	const { contentHeight = 3000, elementTop = 1000, elementHeight = 200 } = opts;
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
	target.style.background = 'red';

	spacer.appendChild(target);
	document.body.appendChild(spacer);
	return { spacer, target };
};

/** Setup: scrollable container div (non-window scroll parent) */
const setupContainer = (
	opts: {
		containerHeight?: number;
		contentHeight?: number;
		elementTop?: number;
		elementHeight?: number;
		containerCss?: Partial<CSSStyleDeclaration>;
	} = {}
) => {
	const { containerHeight = 400, contentHeight = 2000, elementTop = 800, elementHeight = 100, containerCss = {} } = opts;
	document.body.style.margin = '0';
	document.body.style.padding = '0';

	const container = document.createElement('div');
	container.style.height = `${containerHeight}px`;
	container.style.overflow = 'auto';
	container.style.position = 'relative';
	Object.assign(container.style, containerCss);

	const content = document.createElement('div');
	content.style.height = `${contentHeight}px`;
	content.style.position = 'relative';

	const target = document.createElement('div');
	target.style.position = 'absolute';
	target.style.top = `${elementTop}px`;
	target.style.height = `${elementHeight}px`;
	target.style.width = '100%';
	target.style.background = 'blue';

	content.appendChild(target);
	container.appendChild(content);
	document.body.appendChild(container);
	return { container, content, target };
};

const cleanup = () => {
	document.body.innerHTML = '';
	window.scrollTo(0, 0);
};

// --- Tests ---

// #633: Fast scrolling could skip intermediate IO callbacks — elements scrolled past entirely in one frame.
// v3 handles this via potentiallySkipped detection in onContainerUpdate: if scrollDelta > trackSize,
// progress is updated even when not intersecting.
describe('Edge cases: fast scrolling (#633)', () => {
	afterEach(cleanup);

	test('progress is correct after instant scroll past element and back', async () => {
		await page.viewport(1024, 768);
		// Element at 1500px — well below 768px viewport when scrolled to 0
		const { target } = setupWindow({ elementTop: 1500, elementHeight: 100 });
		const scene = new ScrollMagic({ element: target });

		// Instant scroll well past element
		window.scrollTo(0, 2500);
		await waitForFrames(3);
		expect(scene.progress).toBe(1);

		// Instant scroll back to top — element now below viewport
		window.scrollTo(0, 0);
		await waitForFrames(3);
		expect(scene.progress).toBe(0);

		scene.destroy();
	});

	test('all enter/leave events fire during instant scroll through', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });

		const events: string[] = [];
		const scene = new ScrollMagic({ element: target });
		scene.on('enter', () => events.push('enter'));
		scene.on('leave', () => events.push('leave'));

		// Single scroll that jumps completely past the element
		window.scrollTo(0, 2000);
		await waitForFrames(3);

		expect(events).toContain('enter');
		expect(events).toContain('leave');
		expect(scene.progress).toBe(1);

		scene.destroy();
	});
});

// #905: Fixed-positioned scroll containers (overflow:scroll) may behave unexpectedly as IO root.
// #1004: Scroll direction may report incorrectly during programmatic scrolling in non-window containers.
describe('Edge cases: non-window scroll containers (#905, #1004)', () => {
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

// #883: Mobile address bar show/hide changes viewport dimensions; IO rootMargin may not adapt.
// #372: Safari dynamic address bar — viewport height changes affect enter/leave thresholds.
// Tested here by shrinking the viewport programmatically (simulates address bar appearing).
describe('Edge cases: viewport resize (#883, #372)', () => {
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
		await wait(200); // Container resize is debounced at 100ms
		await waitForFrames(5);

		// Progress should have changed since viewport size affects the tracking calculation
		expect(scene.progress).not.toBe(progressBefore);

		scene.destroy();
	});
});

// #986: Lazy-loaded images changing layout may not trigger ResizeObserver or bounds recalculation in time.
// Tested by resizing the tracked element after initial scroll (simulates lazy image load).
describe('Edge cases: element resize / layout shifts (#986)', () => {
	afterEach(cleanup);

	test('progress recalculates when tracked element changes size', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 300, elementHeight: 200 });
		const scene = new ScrollMagic({ element: target });

		// Scroll and wait for IO to fire and set intersecting=true
		window.scrollTo(0, 200);
		await waitForFrames(3);
		const progressBefore = scene.progress;
		expect(progressBefore).toBeGreaterThan(0);

		// Simulate lazy image loading — element grows taller
		target.style.height = '600px';
		// ResizeObserver fires before next paint; wait generously for it + scheduler flush
		await wait(500);
		await waitForFrames(5);

		// Track size changed, so progress should differ
		expect(scene.progress).not.toBe(progressBefore);

		scene.destroy();
	});
});

// #911: Major DOM mutations (removing large nodes) while scrolled could cause scroll position drift.
// Tested by removing a large block above the tracked element mid-scroll.
describe('Edge cases: DOM mutation (#911)', () => {
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

		const scene = new ScrollMagic({ element: target });

		// Scroll to see the target
		window.scrollTo(0, 500);
		await waitForFrames(3);
		expect(scene.progress).toBeGreaterThan(0);

		// Remove the 800px block above — target shifts up in layout
		aboveBlock.remove();
		await waitForFrames(5);

		// Should not crash; progress should be a valid number
		expect(scene.progress).toBeGreaterThanOrEqual(0);
		expect(scene.progress).toBeLessThanOrEqual(1);
		expect(Number.isNaN(scene.progress)).toBe(false);

		scene.destroy();
	});
});

// #618: SVG elements may report incorrect bounding boxes in Firefox, affecting IO tracking.
// #460: SVG child elements (<path>, <g>, <use>) as IO targets — zero-dimension or referenced elements
//       may behave unexpectedly. Smoke-tested here with an <svg> root element.
describe('Edge cases: SVG elements (#618, #460)', () => {
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
		const scene = new ScrollMagic({ element: svg });
		scene.on('enter', () => events.push('enter'));
		scene.on('leave', () => events.push('leave'));

		// Scroll into view
		window.scrollTo(0, 800);
		await waitForFrames(3);
		expect(events).toContain('enter');
		expect(scene.progress).toBeGreaterThan(0);

		// Scroll past
		window.scrollTo(0, 1500);
		await waitForFrames(3);
		expect(scene.progress).toBe(1);

		scene.destroy();
	});
});

// #630: Browser scroll restoration — if scroll position is restored after instance creation, initial state may be wrong.
// #596: Chrome fires scroll events on refresh to restore position — could cause incorrect initial progress/events.
// Tested by creating instances at non-zero scroll positions (simulates restoration scenario).
describe('Edge cases: scroll state initialization (#630, #596)', () => {
	afterEach(cleanup);

	test('correct initial progress when instance created at non-zero scroll', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });

		// Scroll past element BEFORE creating instance
		window.scrollTo(0, 2000);
		await waitForFrames(3);

		// Now create instance — should detect current position
		const scene = new ScrollMagic({ element: target });
		await waitForFrames(3);

		expect(scene.progress).toBe(1);

		scene.destroy();
	});

	test('correct initial progress when element is partially visible on creation', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 400 });

		// Scroll to a position where element is partially visible
		window.scrollTo(0, 500);
		await waitForFrames(3);

		const scene = new ScrollMagic({ element: target });
		await waitForFrames(3);

		expect(scene.progress).toBeGreaterThan(0);
		expect(scene.progress).toBeLessThan(1);

		scene.destroy();
	});

	test('fires enter event when created at position where element is visible', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 300, elementHeight: 200 });

		// Scroll so element is in view
		window.scrollTo(0, 200);
		await waitForFrames(3);

		const events: string[] = [];
		const scene = new ScrollMagic({ element: target });
		scene.on('enter', () => events.push('enter'));
		scene.on('progress', () => events.push('progress'));
		await waitForFrames(3);

		expect(events).toContain('enter');
		expect(events).toContain('progress');

		scene.destroy();
	});
});

// #948: scrollDirection may be incorrect if no scroll has occurred yet (no previous position to compare).
// Tested by verifying forward/reverse direction on first and subsequent scrolls.
describe('Edge cases: event direction (#948)', () => {
	afterEach(cleanup);

	test('direction is forward when element scrolled past from above', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });

		const enterDirections: string[] = [];
		const leaveDirections: string[] = [];
		const scene = new ScrollMagic({ element: target });
		scene.on('enter', (e: ScrollMagicEvent) => enterDirections.push(e.direction));
		scene.on('leave', (e: ScrollMagicEvent) => leaveDirections.push(e.direction));

		window.scrollTo(0, 2000);
		await waitForFrames(3);

		expect(enterDirections).toContain('forward');
		expect(leaveDirections).toContain('forward');

		scene.destroy();
	});

	test('direction is reverse when scrolling back up past element', async () => {
		await page.viewport(1024, 768);
		// Element below viewport when scrolled to 0, so reverse scroll exits fully
		const { target } = setupWindow({ elementTop: 1500, elementHeight: 100 });

		const scene = new ScrollMagic({ element: target });

		// First scroll past
		window.scrollTo(0, 2500);
		await waitForFrames(3);
		expect(scene.progress).toBe(1);

		const enterDirections: string[] = [];
		const leaveDirections: string[] = [];
		scene.on('enter', (e: ScrollMagicEvent) => enterDirections.push(e.direction));
		scene.on('leave', (e: ScrollMagicEvent) => leaveDirections.push(e.direction));

		// Scroll back to top — element now below viewport
		window.scrollTo(0, 0);
		await waitForFrames(3);

		expect(enterDirections).toContain('reverse');
		expect(leaveDirections).toContain('reverse');

		scene.destroy();
	});
});

// #397: Browser find (Cmd+F) triggers scroll-to-element — verify progress remains correct
//       after browser-initiated scrolls. Tested via programmatic scrollTo jumps (same mechanism).
describe('Edge cases: programmatic scroll jumps (#397)', () => {
	afterEach(cleanup);

	test('progress correct after multiple programmatic scrollTo jumps', async () => {
		await page.viewport(1024, 768);
		// Element below viewport when at scroll=0
		const { target } = setupWindow({ elementTop: 1500, elementHeight: 200 });
		const scene = new ScrollMagic({ element: target });

		// Jump to where element is partially visible
		window.scrollTo(0, 1200);
		await waitForFrames(3);
		expect(scene.progress).toBeGreaterThan(0);
		expect(scene.progress).toBeLessThan(1);

		// Jump far past
		window.scrollTo(0, 2500);
		await waitForFrames(3);
		expect(scene.progress).toBe(1);

		// Jump back to before element (element below viewport)
		window.scrollTo(0, 0);
		await waitForFrames(3);
		expect(scene.progress).toBe(0);

		// Jump directly into element again
		window.scrollTo(0, 1300);
		await waitForFrames(3);
		expect(scene.progress).toBeGreaterThan(0);

		scene.destroy();
	});
});
