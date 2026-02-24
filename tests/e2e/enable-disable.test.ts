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
		const sm = new ScrollMagic({ element: target });
		expect(sm.disabled).toBe(false);
		sm.destroy();
	});

	test('disabled is true after disable(), false after enable()', () => {
		const { target } = setupWindow();
		const sm = new ScrollMagic({ element: target });
		sm.disable();
		expect(sm.disabled).toBe(true);
		sm.enable();
		expect(sm.disabled).toBe(false);
		sm.destroy();
	});

	test('disable() and enable() return the instance (chaining)', () => {
		const { target } = setupWindow();
		const sm = new ScrollMagic({ element: target });
		expect(sm.disable()).toBe(sm);
		expect(sm.enable()).toBe(sm);
		sm.destroy();
	});

	test('double disable() does not throw', () => {
		const { target } = setupWindow();
		const sm = new ScrollMagic({ element: target });
		sm.disable();
		expect(() => sm.disable()).not.toThrow();
		sm.destroy();
	});

	test('double enable() does not throw', () => {
		const { target } = setupWindow();
		const sm = new ScrollMagic({ element: target });
		expect(() => sm.enable()).not.toThrow();
		sm.destroy();
	});

	test('modify() works when disabled (updates options)', () => {
		const { target } = setupWindow();
		const sm = new ScrollMagic({ element: target });
		sm.disable();
		sm.modify({ containerStart: 0.5 });
		expect(sm.containerStart).toBe(0.5);
		sm.destroy();
	});

	test('on()/off()/subscribe() work when disabled', () => {
		const { target } = setupWindow();
		const sm = new ScrollMagic({ element: target });
		sm.disable();
		const handler = () => {};
		expect(() => sm.on('progress', handler)).not.toThrow();
		expect(() => sm.off('progress', handler)).not.toThrow();
		const unsub = sm.subscribe('progress', handler);
		expect(typeof unsub).toBe('function');
		sm.destroy();
	});

	test('addPlugin()/removePlugin() work when disabled', () => {
		const { target } = setupWindow();
		const sm = new ScrollMagic({ element: target });
		sm.disable();
		const plugin = { name: 'test', onAdd: vi.fn(), onRemove: vi.fn() };
		sm.addPlugin(plugin);
		expect(plugin.onAdd).toHaveBeenCalledOnce();
		expect(sm.pluginList).toHaveLength(1);
		sm.removePlugin(plugin);
		expect(plugin.onRemove).toHaveBeenCalledOnce();
		expect(sm.pluginList).toHaveLength(0);
		sm.destroy();
	});

	test('disable() calls onDisable on all plugins', () => {
		const { target } = setupWindow();
		const sm = new ScrollMagic({ element: target });
		const plugin = { name: 'test', onDisable: vi.fn() };
		sm.addPlugin(plugin);

		sm.disable();
		expect(plugin.onDisable).toHaveBeenCalledOnce();
		sm.destroy();
	});

	test('enable() calls onEnable on all plugins', () => {
		const { target } = setupWindow();
		const sm = new ScrollMagic({ element: target });
		const plugin = { name: 'test', onEnable: vi.fn() };
		sm.addPlugin(plugin);

		sm.disable();
		sm.enable();
		expect(plugin.onEnable).toHaveBeenCalledOnce();
		sm.destroy();
	});

	test('onDisable/onEnable are not called on idempotent calls', () => {
		const { target } = setupWindow();
		const sm = new ScrollMagic({ element: target });
		const plugin = { name: 'test', onEnable: vi.fn(), onDisable: vi.fn() };
		sm.addPlugin(plugin);

		// already enabled — enable() should no-op
		sm.enable();
		expect(plugin.onEnable).not.toHaveBeenCalled();

		sm.disable();
		expect(plugin.onDisable).toHaveBeenCalledOnce();

		// already disabled — disable() should no-op
		sm.disable();
		expect(plugin.onDisable).toHaveBeenCalledOnce(); // still just once

		sm.destroy();
	});

	test('progress getter returns last known value when disabled', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });
		const sm = new ScrollMagic({ element: target });

		window.scrollTo(0, 2000);
		await waitForFrames(3);
		expect(sm.progress).toBe(1);

		sm.disable();
		expect(sm.progress).toBe(1);

		sm.destroy();
	});

	test('activeRange still works when disabled', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });
		const sm = new ScrollMagic({ element: target });

		await waitForFrames(3);
		const offsetBefore = sm.activeRange;

		sm.disable();
		const offsetWhileDisabled = sm.activeRange;

		expect(offsetWhileDisabled).toEqual(offsetBefore);
		sm.destroy();
	});

	test('refresh() is a no-op when disabled (no errors)', () => {
		const { target } = setupWindow();
		const sm = new ScrollMagic({ element: target });
		sm.disable();
		expect(() => sm.refresh()).not.toThrow();
		sm.destroy();
	});

	test('destroy() fully tears down a disabled instance', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });

		const events: string[] = [];
		const sm = new ScrollMagic({ element: target });
		sm.on('enter', () => events.push('enter'));
		sm.on('progress', () => events.push('progress'));

		sm.disable();
		sm.destroy();

		// re-enable should be impossible (destroyed)
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		sm.enable();
		expect(sm.disabled).toBe(true); // still disabled — enable was a no-op

		window.scrollTo(0, 2000);
		await waitForFrames(3);

		expect(events).toHaveLength(0);
	});

	test('disabled is true after destroy() (without prior disable())', () => {
		const { target } = setupWindow();
		const sm = new ScrollMagic({ element: target });
		sm.destroy();
		expect(sm.disabled).toBe(true);
	});

	test('enable() after destroy() warns and no-ops', () => {
		const { target } = setupWindow();
		const sm = new ScrollMagic({ element: target });
		sm.destroy();
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		sm.enable();
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('destroyed');
		expect(sm.disabled).toBe(true);
	});

	test('disable() after destroy() warns and no-ops', () => {
		const { target } = setupWindow();
		const sm = new ScrollMagic({ element: target });
		sm.destroy();
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		sm.disable();
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
		const sm = new ScrollMagic({ element: target });
		sm.on('enter', () => events.push('enter'));
		sm.on('progress', () => events.push('progress'));
		sm.on('leave', () => events.push('leave'));

		sm.disable();

		window.scrollTo(0, 2000);
		await waitForFrames(3);

		expect(events).toHaveLength(0);

		sm.destroy();
	});

	test('disable() freezes progress at pre-disable value', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });
		const sm = new ScrollMagic({ element: target });

		window.scrollTo(0, 2000);
		await waitForFrames(3);
		expect(sm.progress).toBe(1);

		sm.disable();

		window.scrollTo(0, 0);
		await waitForFrames(3);

		expect(sm.progress).toBe(1);

		sm.destroy();
	});

	test('enable() resumes tracking — progress updates after re-enable', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });
		const sm = new ScrollMagic({ element: target });

		sm.disable();

		// Scroll past while disabled
		window.scrollTo(0, 2000);
		await waitForFrames(3);
		expect(sm.progress).toBe(0); // frozen at initial value

		sm.enable();
		await waitForFrames(3);

		expect(sm.progress).toBe(1);

		sm.destroy();
	});

	test('enable() fires events after resuming', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });
		const sm = new ScrollMagic({ element: target });

		sm.disable();

		// Scroll past while disabled
		window.scrollTo(0, 2000);
		await waitForFrames(3);

		const events: string[] = [];
		sm.on('enter', () => events.push('enter'));
		sm.on('progress', () => events.push('progress'));
		sm.on('leave', () => events.push('leave'));

		sm.enable();
		await waitForFrames(3);

		expect(events).toContain('enter');
		expect(events).toContain('progress');

		sm.destroy();
	});

	test('rapid toggle (disable → enable → disable) in one frame cancels scheduled work', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });

		const events: string[] = [];
		const sm = new ScrollMagic({ element: target });
		sm.on('enter', () => events.push('enter'));
		sm.on('progress', () => events.push('progress'));

		// Rapid toggle before rAF fires — enable() schedules work, disable() cancels it
		sm.disable();
		sm.enable();
		sm.disable();

		expect(sm.disabled).toBe(true);

		window.scrollTo(0, 2000);
		await waitForFrames(3);

		expect(events).toHaveLength(0);
		expect(sm.progress).toBe(0);

		sm.destroy();
	});

	test('modify({ element }) while disabled takes effect on enable()', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });
		const sm = new ScrollMagic({ element: target });

		// Create a second element further down
		const newTarget = document.createElement('div');
		newTarget.style.position = 'absolute';
		newTarget.style.top = '1500px';
		newTarget.style.height = '100px';
		newTarget.style.width = '100%';
		target.parentElement!.appendChild(newTarget);

		sm.disable();
		sm.modify({ element: newTarget });
		expect(sm.element).toBe(newTarget);

		// Scroll past the NEW element position
		window.scrollTo(0, 2500);
		await waitForFrames(3);
		expect(sm.progress).toBe(0); // still frozen

		sm.enable();
		await waitForFrames(3);

		expect(sm.progress).toBe(1); // tracking the new element

		sm.destroy();
	});

	test('modify({ container }) while disabled takes effect on enable()', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });
		const sm = new ScrollMagic({ element: target });

		sm.disable();
		sm.modify({ container: window }); // same container in this case, but exercises the code path
		expect(sm.container).toBe(window);

		sm.enable();
		await waitForFrames(3);

		// Should be tracking normally after re-enable with new container
		window.scrollTo(0, 2000);
		await waitForFrames(3);
		expect(sm.progress).toBe(1);

		sm.destroy();
	});

	test('modify() while disabled takes effect on enable()', async () => {
		await page.viewport(1024, 768);
		const { target } = setupWindow({ elementTop: 500, elementHeight: 100 });
		const sm = new ScrollMagic({ element: target });

		sm.disable();
		sm.modify({ containerStart: 0.5 });

		sm.enable();
		await waitForFrames(3);

		expect(sm.containerStart).toBe(0.5);
		// Verify the new containerStart is actually in effect by checking resolved offsets
		expect(sm.resolvedBounds.container.offsetStart).toBeGreaterThan(0);

		sm.destroy();
	});
});
