import { describe, test, expect, afterEach, vi } from 'vitest';
import ScrollMagic from '../../src/index';
import { cleanup, setupWindow } from './helpers';

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

describe('destroy: idempotency', () => {
	test('calling destroy twice does not warn', () => {
		const { target } = setupWindow();
		const scene = new ScrollMagic({ element: target });
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		scene.destroy();
		scene.destroy();

		expect(warnSpy).not.toHaveBeenCalled();
	});
});

describe('destroy: post-destroy dev warnings', () => {
	const makeScene = () => {
		const { target } = setupWindow();
		const scene = new ScrollMagic({ element: target });
		scene.destroy();
		return { scene, target };
	};

	test('modify() warns', () => {
		const { scene, target } = makeScene();
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		scene.modify({ element: target });
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('destroyed');
	});

	test('refresh() warns', () => {
		const { scene } = makeScene();
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		scene.refresh();
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('destroyed');
	});

	test('addPlugin() warns', () => {
		const { scene } = makeScene();
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		scene.addPlugin({ name: 'test' });
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('destroyed');
	});

	test('removePlugin() warns', () => {
		const { scene } = makeScene();
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		scene.removePlugin({ name: 'test' });
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('destroyed');
	});

	test('on() warns', () => {
		const { scene } = makeScene();
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		scene.on('progress', () => {});
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('destroyed');
	});

	test('off() warns', () => {
		const { scene } = makeScene();
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		scene.off('progress', () => {});
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('destroyed');
	});

	test('subscribe() warns', () => {
		const { scene } = makeScene();
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		scene.subscribe('progress', () => {});
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('destroyed');
	});

	test('scrollOffset warns', () => {
		const { scene } = makeScene();
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		void scene.scrollOffset;
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('destroyed');
	});
});

describe('destroy: plugin cleanup', () => {
	test('destroy() calls onDestroy (not onRemove) on all plugins', () => {
		const { target } = setupWindow();
		const scene = new ScrollMagic({ element: target });
		const plugin1 = { name: 'p1', onRemove: vi.fn(), onDestroy: vi.fn() };
		const plugin2 = { name: 'p2', onRemove: vi.fn(), onDestroy: vi.fn() };
		scene.addPlugin(plugin1);
		scene.addPlugin(plugin2);

		scene.destroy();

		expect(plugin1.onDestroy).toHaveBeenCalledOnce();
		expect(plugin2.onDestroy).toHaveBeenCalledOnce();
		expect(plugin1.onRemove).not.toHaveBeenCalled();
		expect(plugin2.onRemove).not.toHaveBeenCalled();
		expect(scene.pluginList).toHaveLength(0);
	});

	test('destroy() calls onDisable before onDestroy (when enabled)', () => {
		const { target } = setupWindow();
		const scene = new ScrollMagic({ element: target });
		const order: string[] = [];
		const plugin = {
			name: 'order-test',
			onDisable: vi.fn(() => order.push('disable')),
			onDestroy: vi.fn(() => order.push('destroy')),
		};
		scene.addPlugin(plugin);

		scene.destroy();

		expect(order).toEqual(['disable', 'destroy']);
	});

	test('destroy() skips onDisable when already disabled', () => {
		const { target } = setupWindow();
		const scene = new ScrollMagic({ element: target });
		const plugin = {
			name: 'test',
			onDisable: vi.fn(),
			onDestroy: vi.fn(),
		};
		scene.addPlugin(plugin);

		scene.disable();
		plugin.onDisable.mockClear(); // reset from the explicit disable() call

		scene.destroy();

		expect(plugin.onDisable).not.toHaveBeenCalled();
		expect(plugin.onDestroy).toHaveBeenCalledOnce();
	});
});

describe('destroy: post-destroy no-op behaviour', () => {
	test('modify() does not change options', () => {
		const { target } = setupWindow();
		const otherElement = document.createElement('div');
		document.body.appendChild(otherElement);

		const scene = new ScrollMagic({ element: target });
		scene.destroy();
		vi.spyOn(console, 'warn').mockImplementation(() => {});

		scene.modify({ element: otherElement });
		expect(scene.element).toBe(target);
	});

	test('addPlugin() does not register the plugin', () => {
		const { target } = setupWindow();
		const scene = new ScrollMagic({ element: target });
		scene.destroy();
		vi.spyOn(console, 'warn').mockImplementation(() => {});

		const plugin = { name: 'test', onAdd: vi.fn() };
		scene.addPlugin(plugin);

		expect(plugin.onAdd).not.toHaveBeenCalled();
		expect(scene.pluginList).toHaveLength(0);
	});

	test('subscribe() returns a no-op cleanup function', () => {
		const { target } = setupWindow();
		const scene = new ScrollMagic({ element: target });
		scene.destroy();
		vi.spyOn(console, 'warn').mockImplementation(() => {});

		const unsub = scene.subscribe('progress', () => {});
		expect(unsub).toBeTypeOf('function');
		expect(() => unsub()).not.toThrow();
	});

	test('scrollOffset returns { start: 0, end: 0 }', () => {
		const { target } = setupWindow();
		const scene = new ScrollMagic({ element: target });
		scene.destroy();
		vi.spyOn(console, 'warn').mockImplementation(() => {});

		expect(scene.scrollOffset).toEqual({ start: 0, end: 0 });
	});
});
