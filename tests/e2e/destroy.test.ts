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
		const sm = new ScrollMagic({ element: target });
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		sm.destroy();
		sm.destroy();

		expect(warnSpy).not.toHaveBeenCalled();
	});
});

describe('destroy: post-destroy dev warnings', () => {
	const makeScene = () => {
		const { target } = setupWindow();
		const sm = new ScrollMagic({ element: target });
		sm.destroy();
		return { sm, target };
	};

	test('modify() warns', () => {
		const { sm, target } = makeScene();
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		sm.modify({ element: target });
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('destroyed');
	});

	test('refresh() warns', () => {
		const { sm } = makeScene();
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		sm.refresh();
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('destroyed');
	});

	test('addPlugin() warns', () => {
		const { sm } = makeScene();
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		sm.addPlugin({ name: 'test' });
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('destroyed');
	});

	test('removePlugin() warns', () => {
		const { sm } = makeScene();
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		sm.removePlugin({ name: 'test' });
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('destroyed');
	});

	test('on() warns', () => {
		const { sm } = makeScene();
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		sm.on('progress', () => {});
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('destroyed');
	});

	test('off() warns', () => {
		const { sm } = makeScene();
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		sm.off('progress', () => {});
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('destroyed');
	});

	test('subscribe() warns', () => {
		const { sm } = makeScene();
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		sm.subscribe('progress', () => {});
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('destroyed');
	});

	test('activeRange warns', () => {
		const { sm } = makeScene();
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		void sm.activeRange;
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('destroyed');
	});
});

describe('destroy: plugin cleanup', () => {
	test('destroy() calls onDestroy (not onRemove) on all plugins', () => {
		const { target } = setupWindow();
		const sm = new ScrollMagic({ element: target });
		const plugin1 = { name: 'p1', onRemove: vi.fn(), onDestroy: vi.fn() };
		const plugin2 = { name: 'p2', onRemove: vi.fn(), onDestroy: vi.fn() };
		sm.addPlugin(plugin1);
		sm.addPlugin(plugin2);

		sm.destroy();

		expect(plugin1.onDestroy).toHaveBeenCalledOnce();
		expect(plugin2.onDestroy).toHaveBeenCalledOnce();
		expect(plugin1.onRemove).not.toHaveBeenCalled();
		expect(plugin2.onRemove).not.toHaveBeenCalled();
		expect(sm.pluginList).toHaveLength(0);
	});

	test('destroy() calls onDisable before onDestroy (when enabled)', () => {
		const { target } = setupWindow();
		const sm = new ScrollMagic({ element: target });
		const order: string[] = [];
		const plugin = {
			name: 'order-test',
			onDisable: vi.fn(() => order.push('disable')),
			onDestroy: vi.fn(() => order.push('destroy')),
		};
		sm.addPlugin(plugin);

		sm.destroy();

		expect(order).toEqual(['disable', 'destroy']);
	});

	test('destroy() skips onDisable when already disabled', () => {
		const { target } = setupWindow();
		const sm = new ScrollMagic({ element: target });
		const plugin = {
			name: 'test',
			onDisable: vi.fn(),
			onDestroy: vi.fn(),
		};
		sm.addPlugin(plugin);

		sm.disable();
		plugin.onDisable.mockClear(); // reset from the explicit disable() call

		sm.destroy();

		expect(plugin.onDisable).not.toHaveBeenCalled();
		expect(plugin.onDestroy).toHaveBeenCalledOnce();
	});
});

describe('destroy: post-destroy no-op behaviour', () => {
	test('modify() does not change options', () => {
		const { target } = setupWindow();
		const otherElement = document.createElement('div');
		document.body.appendChild(otherElement);

		const sm = new ScrollMagic({ element: target });
		sm.destroy();
		vi.spyOn(console, 'warn').mockImplementation(() => {});

		sm.modify({ element: otherElement });
		expect(sm.element).toBe(target);
	});

	test('addPlugin() does not register the plugin', () => {
		const { target } = setupWindow();
		const sm = new ScrollMagic({ element: target });
		sm.destroy();
		vi.spyOn(console, 'warn').mockImplementation(() => {});

		const plugin = { name: 'test', onAdd: vi.fn() };
		sm.addPlugin(plugin);

		expect(plugin.onAdd).not.toHaveBeenCalled();
		expect(sm.pluginList).toHaveLength(0);
	});

	test('subscribe() returns a no-op cleanup function', () => {
		const { target } = setupWindow();
		const sm = new ScrollMagic({ element: target });
		sm.destroy();
		vi.spyOn(console, 'warn').mockImplementation(() => {});

		const unsub = sm.subscribe('progress', () => {});
		expect(unsub).toBeTypeOf('function');
		expect(() => unsub()).not.toThrow();
	});

	test('activeRange returns { start: 0, end: 0 }', () => {
		const { target } = setupWindow();
		const sm = new ScrollMagic({ element: target });
		sm.destroy();
		vi.spyOn(console, 'warn').mockImplementation(() => {});

		expect(sm.activeRange).toEqual({ start: 0, end: 0 });
	});
});
