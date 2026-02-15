import { describe, test, expect, vi } from 'vitest';
import { EventDispatcher, DispatchableEvent } from '../../src/EventDispatcher';

interface TestEvent extends DispatchableEvent {
	readonly target: unknown;
	readonly type: 'foo' | 'bar';
	readonly value?: number;
}

const event = (type: TestEvent['type'], value?: number): TestEvent => ({ target: null, type, value });

describe('EventDispatcher', () => {
	test('calls listener on dispatch', () => {
		const d = new EventDispatcher<TestEvent>();
		const cb = vi.fn();
		d.addEventListener('foo', cb);
		d.dispatchEvent(event('foo', 1));
		expect(cb).toHaveBeenCalledOnce();
		expect(cb).toHaveBeenCalledWith(expect.objectContaining({ type: 'foo', value: 1 }));
	});

	test('does not call listener for different event type', () => {
		const d = new EventDispatcher<TestEvent>();
		const cb = vi.fn();
		d.addEventListener('foo', cb);
		d.dispatchEvent(event('bar'));
		expect(cb).not.toHaveBeenCalled();
	});

	test('supports multiple listeners for same type', () => {
		const d = new EventDispatcher<TestEvent>();
		const cb1 = vi.fn();
		const cb2 = vi.fn();
		d.addEventListener('foo', cb1);
		d.addEventListener('foo', cb2);
		d.dispatchEvent(event('foo'));
		expect(cb1).toHaveBeenCalledOnce();
		expect(cb2).toHaveBeenCalledOnce();
	});

	test('allows duplicate registrations (both fire)', () => {
		const d = new EventDispatcher<TestEvent>();
		const cb = vi.fn();
		d.addEventListener('foo', cb);
		d.addEventListener('foo', cb);
		d.dispatchEvent(event('foo'));
		expect(cb).toHaveBeenCalledTimes(2);
	});

	test('removeEventListener stops future calls', () => {
		const d = new EventDispatcher<TestEvent>();
		const cb = vi.fn();
		d.addEventListener('foo', cb);
		d.removeEventListener('foo', cb);
		d.dispatchEvent(event('foo'));
		expect(cb).not.toHaveBeenCalled();
	});

	test('addEventListener returns unsubscribe function', () => {
		const d = new EventDispatcher<TestEvent>();
		const cb = vi.fn();
		const unsub = d.addEventListener('foo', cb);
		unsub();
		d.dispatchEvent(event('foo'));
		expect(cb).not.toHaveBeenCalled();
	});

	test('removing non-existent listener is a no-op', () => {
		const d = new EventDispatcher<TestEvent>();
		expect(() => d.removeEventListener('foo', vi.fn())).not.toThrow();
	});

	test('dispatch with no listeners is a no-op', () => {
		const d = new EventDispatcher<TestEvent>();
		expect(() => d.dispatchEvent(event('foo'))).not.toThrow();
	});
});
