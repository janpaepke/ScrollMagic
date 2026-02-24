import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { ScrollMagic } from '../../src/ScrollMagic';

const destroyMock = vi.fn();
const subscribeMock = vi.fn(() => vi.fn());

vi.mock('../../src/Container', () => ({
	Container: class MockContainer {
		containerElement: unknown;
		subscribe = subscribeMock;
		destroy = destroyMock;
		size = Object.freeze({ clientWidth: 100, clientHeight: 200, scrollWidth: 300, scrollHeight: 400 });
		position = Object.freeze({ top: 10, left: 20 });
		scrollVelocity = Object.freeze({ x: 1, y: 2 });
		constructor(containerElement: unknown) {
			this.containerElement = containerElement;
		}
	},
}));

import { ContainerProxy } from '../../src/ContainerProxy';

const fakeSm = (id = 1) => ({ id }) as unknown as ScrollMagic;

describe('ContainerProxy', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('attach subscribes to resize and scroll events', () => {
		const proxy = new ContainerProxy(fakeSm());
		const cb = vi.fn();
		proxy.attach(document.createElement('div'), cb);

		expect(subscribeMock).toHaveBeenCalledWith('resize', cb);
		expect(subscribeMock).toHaveBeenCalledWith('scroll', cb);

		proxy.detach();
	});

	test('two proxies sharing the same container element share size/position', () => {
		const el = document.createElement('div');
		const proxy1 = new ContainerProxy(fakeSm(1));
		const proxy2 = new ContainerProxy(fakeSm(2));

		proxy1.attach(el, vi.fn());
		proxy2.attach(el, vi.fn());

		// Both see the same underlying Container state
		expect(proxy1.size).toEqual(proxy2.size);
		expect(proxy1.position).toEqual(proxy2.position);

		proxy1.detach();
		proxy2.detach();
	});

	test('Container is destroyed only when the last proxy detaches', () => {
		const el = document.createElement('div');
		const proxy1 = new ContainerProxy(fakeSm(1));
		const proxy2 = new ContainerProxy(fakeSm(2));

		proxy1.attach(el, vi.fn());
		proxy2.attach(el, vi.fn());

		proxy1.detach();
		expect(destroyMock).not.toHaveBeenCalled();

		proxy2.detach();
		expect(destroyMock).toHaveBeenCalledOnce();
	});

	test('detach unsubscribes from container events', () => {
		const unsubscribe1 = vi.fn();
		const unsubscribe2 = vi.fn();
		subscribeMock.mockReturnValueOnce(unsubscribe1).mockReturnValueOnce(unsubscribe2);

		const proxy = new ContainerProxy(fakeSm());
		proxy.attach(document.createElement('div'), vi.fn());
		proxy.detach();

		expect(unsubscribe1).toHaveBeenCalledOnce();
		expect(unsubscribe2).toHaveBeenCalledOnce();
	});

	test('detach on unattached proxy is a no-op', () => {
		const proxy = new ContainerProxy(fakeSm());
		expect(() => proxy.detach()).not.toThrow();
	});

	test('attach to a new element detaches from the previous one', () => {
		const el1 = document.createElement('div');
		const el2 = document.createElement('div');
		const proxy = new ContainerProxy(fakeSm());

		proxy.attach(el1, vi.fn());
		proxy.attach(el2, vi.fn());

		// First container destroyed (sole user detached)
		expect(destroyMock).toHaveBeenCalledOnce();
		// Still functional on new container
		expect(() => proxy.size).not.toThrow();

		proxy.detach();
	});

	test('size delegates to the underlying Container', () => {
		const proxy = new ContainerProxy(fakeSm());
		proxy.attach(document.createElement('div'), vi.fn());
		expect(proxy.size).toEqual({ clientWidth: 100, clientHeight: 200, scrollWidth: 300, scrollHeight: 400 });
		proxy.detach();
	});

	test('position delegates to the underlying Container', () => {
		const proxy = new ContainerProxy(fakeSm());
		proxy.attach(document.createElement('div'), vi.fn());
		expect(proxy.position).toEqual({ top: 10, left: 20 });
		proxy.detach();
	});

	test('scrollVelocity delegates to the underlying Container', () => {
		const proxy = new ContainerProxy(fakeSm());
		proxy.attach(document.createElement('div'), vi.fn());
		expect(proxy.scrollVelocity).toEqual({ x: 1, y: 2 });
		proxy.detach();
	});

	test('scrollVelocity returns zero when not attached', () => {
		const proxy = new ContainerProxy(fakeSm());
		expect(proxy.scrollVelocity).toEqual({ x: 0, y: 0 });
	});

	test('size throws when not attached', () => {
		const proxy = new ContainerProxy(fakeSm());
		expect(() => proxy.size).toThrow("Can't get size when not attached");
	});

	test('position throws when not attached', () => {
		const proxy = new ContainerProxy(fakeSm());
		expect(() => proxy.position).toThrow("Can't get position when not attached");
	});
});
