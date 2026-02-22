/**
 * Enable/disable: pause and resume tracking without destroying.
 * Tests for: state & getters, method guards, idempotency, chaining,
 * tracking pause/resume, event suppression, modify-while-disabled.
 */
import { describe, test, expect, afterEach, vi } from 'vitest';
import { page } from 'vitest/browser';
import ScrollMagic from '../../src/index';
import { cleanup, setupWindow, waitForFrames } from './helpers';

describe('enable/disable: state & guards', () => {
	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
	});

	test('disabled is false by default', () => {
		const { target } = setupWindow();
		const scene = new ScrollMagic({ element: target });
		expect(scene.disabled).toBe(false);
		scene.destroy();
	});

	test('disabled is true after disable(), false after enable()', () => {
		const { target } = setupWindow();
		const scene = new ScrollMagic({ element: target });
		scene.disable();
		expect(scene.disabled).toBe(true);
		scene.enable();
		expect(scene.disabled).toBe(false);
		scene.destroy();
	});

	test('disable() and enable() return the instance (chaining)', () => {
		const { target } = setupWindow();
		const scene = new ScrollMagic({ element: target });
		expect(scene.disable()).toBe(scene);
		expect(scene.enable()).toBe(scene);
		scene.destroy();
	});

	test('double disable() does not throw', () => {
		const { target } = setupWindow();
		const scene = new ScrollMagic({ element: target });
		scene.disable();
		expect(() => scene.disable()).not.toThrow();
		scene.destroy();
	});

	test('double enable() does not throw', () => {
		const { target } = setupWindow();
		const scene = new ScrollMagic({ element: target });
		expect(() => scene.enable()).not.toThrow();
		scene.destroy();
	});

	test('modify() works when disabled (updates options)', () => {
		const { target } = setupWindow();
		const scene = new ScrollMagic({ element: target });
		scene.disable();
		scene.modify({ triggerStart: 0.5 });
		expect(scene.triggerStart).toBe(0.5);
		scene.destroy();
	});

	test('on()/off()/subscribe() work when disabled', () => {
		const { target } = setupWindow();
		const scene = new ScrollMagic({ element: target });
		scene.disable();
		const handler = () => {};
		expect(() => scene.on('progress', handler)).not.toThrow();
		expect(() => scene.off('progress', handler)).not.toThrow();
		const unsub = scene.subscribe('progress', handler);
		expect(typeof unsub).toBe('function');
		scene.destroy();
	});

	test('addPlugin()/removePlugin() work when disabled', () => {
		const { target } = setupWindow();
		const scene = new ScrollMagic({ element: target });
		scene.disable();
		const plugin = { name: 'test', onAdd: vi.fn(), onRemove: vi.fn() };
		scene.addPlugin(plugin);
		expect(plugin.onAdd).toHaveBeenCalledOnce();
		expect(scene.pluginList).toHaveLength(1);
		scene.removePlugin(plugin);
		expect(plugin.onRemove).toHaveBeenCalledOnce();
		expect(scene.pluginList).toHaveLength(0);
		scene.destroy();
	});

	test('progress getter returns last known value when disabled', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });
		const scene = new ScrollMagic({ element: target });

		window.scrollTo(0, 2000);
		await waitForFrames(3);
		expect(scene.progress).toBe(1);

		scene.disable();
		expect(scene.progress).toBe(1);

		scene.destroy();
	});

	test('scrollOffset still works when disabled', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });
		const scene = new ScrollMagic({ element: target });

		await waitForFrames(3);
		const offsetBefore = scene.scrollOffset;

		scene.disable();
		const offsetWhileDisabled = scene.scrollOffset;

		expect(offsetWhileDisabled).toEqual(offsetBefore);
		scene.destroy();
	});

	test('refresh() is a no-op when disabled (no errors)', () => {
		const { target } = setupWindow();
		const scene = new ScrollMagic({ element: target });
		scene.disable();
		expect(() => scene.refresh()).not.toThrow();
		scene.destroy();
	});

	test('destroy() fully tears down a disabled instance', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });

		const events: string[] = [];
		const scene = new ScrollMagic({ element: target });
		scene.on('enter', () => events.push('enter'));
		scene.on('progress', () => events.push('progress'));

		scene.disable();
		scene.destroy();

		// re-enable should be impossible (destroyed)
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		scene.enable();
		expect(scene.disabled).toBe(true); // still disabled — enable was a no-op

		window.scrollTo(0, 2000);
		await waitForFrames(3);

		expect(events).toHaveLength(0);
	});

	test('disabled is true after destroy() (without prior disable())', () => {
		const { target } = setupWindow();
		const scene = new ScrollMagic({ element: target });
		scene.destroy();
		expect(scene.disabled).toBe(true);
	});

	test('enable() after destroy() warns and no-ops', () => {
		const { target } = setupWindow();
		const scene = new ScrollMagic({ element: target });
		scene.destroy();
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		scene.enable();
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('destroyed');
		expect(scene.disabled).toBe(true);
	});

	test('disable() after destroy() warns and no-ops', () => {
		const { target } = setupWindow();
		const scene = new ScrollMagic({ element: target });
		scene.destroy();
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		scene.disable();
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('destroyed');
	});
});

describe('enable/disable: tracking behavior', () => {
	afterEach(cleanup);

	test('disable() stops events — scroll after disable fires nothing', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });

		const events: string[] = [];
		const scene = new ScrollMagic({ element: target });
		scene.on('enter', () => events.push('enter'));
		scene.on('progress', () => events.push('progress'));
		scene.on('leave', () => events.push('leave'));

		scene.disable();

		window.scrollTo(0, 2000);
		await waitForFrames(3);

		expect(events).toHaveLength(0);

		scene.destroy();
	});

	test('disable() freezes progress at pre-disable value', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });
		const scene = new ScrollMagic({ element: target });

		window.scrollTo(0, 2000);
		await waitForFrames(3);
		expect(scene.progress).toBe(1);

		scene.disable();

		window.scrollTo(0, 0);
		await waitForFrames(3);

		expect(scene.progress).toBe(1);

		scene.destroy();
	});

	test('enable() resumes tracking — progress updates after re-enable', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });
		const scene = new ScrollMagic({ element: target });

		scene.disable();

		// Scroll past while disabled
		window.scrollTo(0, 2000);
		await waitForFrames(3);
		expect(scene.progress).toBe(0); // frozen at initial value

		scene.enable();
		await waitForFrames(3);

		expect(scene.progress).toBe(1);

		scene.destroy();
	});

	test('enable() fires events after resuming', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });
		const scene = new ScrollMagic({ element: target });

		scene.disable();

		// Scroll past while disabled
		window.scrollTo(0, 2000);
		await waitForFrames(3);

		const events: string[] = [];
		scene.on('enter', () => events.push('enter'));
		scene.on('progress', () => events.push('progress'));
		scene.on('leave', () => events.push('leave'));

		scene.enable();
		await waitForFrames(3);

		expect(events).toContain('enter');
		expect(events).toContain('progress');

		scene.destroy();
	});

	test('rapid toggle (disable → enable → disable) in one frame cancels scheduled work', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });

		const events: string[] = [];
		const scene = new ScrollMagic({ element: target });
		scene.on('enter', () => events.push('enter'));
		scene.on('progress', () => events.push('progress'));

		// Rapid toggle before rAF fires — enable() schedules work, disable() cancels it
		scene.disable();
		scene.enable();
		scene.disable();

		expect(scene.disabled).toBe(true);

		window.scrollTo(0, 2000);
		await waitForFrames(3);

		expect(events).toHaveLength(0);
		expect(scene.progress).toBe(0);

		scene.destroy();
	});

	test('modify({ element }) while disabled takes effect on enable()', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });
		const scene = new ScrollMagic({ element: target });

		// Create a second element further down
		const newTarget = document.createElement('div');
		newTarget.style.position = 'absolute';
		newTarget.style.top = '1500px';
		newTarget.style.height = '100px';
		newTarget.style.width = '100%';
		target.parentElement!.appendChild(newTarget);

		scene.disable();
		scene.modify({ element: newTarget });
		expect(scene.element).toBe(newTarget);

		// Scroll past the NEW element position
		window.scrollTo(0, 2500);
		await waitForFrames(3);
		expect(scene.progress).toBe(0); // still frozen

		scene.enable();
		await waitForFrames(3);

		expect(scene.progress).toBe(1); // tracking the new element

		scene.destroy();
	});

	test('modify({ scrollParent }) while disabled takes effect on enable()', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });
		const scene = new ScrollMagic({ element: target });

		scene.disable();
		scene.modify({ scrollParent: window }); // same parent in this case, but exercises the code path
		expect(scene.scrollParent).toBe(window);

		scene.enable();
		await waitForFrames(3);

		// Scene should be tracking normally after re-enable with new scrollParent
		window.scrollTo(0, 2000);
		await waitForFrames(3);
		expect(scene.progress).toBe(1);

		scene.destroy();
	});

	test('modify() while disabled takes effect on enable()', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });
		const scene = new ScrollMagic({ element: target });

		scene.disable();
		scene.modify({ triggerStart: 0.5 });

		scene.enable();
		await waitForFrames(3);

		expect(scene.triggerStart).toBe(0.5);
		// Verify the new triggerStart is actually in effect by checking resolved offsets
		expect(scene.resolvedBounds.scrollParent.offsetStart).toBeGreaterThan(0);

		scene.destroy();
	});
});
