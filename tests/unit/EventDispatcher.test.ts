import { describe, test, expect, vi } from 'vitest';
import { EventDispatcher, type DispatchableEvent } from '../../src/EventDispatcher';

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

	test('once listener fires once then auto-removes', () => {
		const d = new EventDispatcher<TestEvent>();
		const cb = vi.fn();
		d.addEventListener('foo', cb, { once: true });
		d.dispatchEvent(event('foo'));
		d.dispatchEvent(event('foo'));
		expect(cb).toHaveBeenCalledOnce();
	});

	test('once listener is removable via removeEventListener before firing', () => {
		const d = new EventDispatcher<TestEvent>();
		const cb = vi.fn();
		d.addEventListener('foo', cb, { once: true });
		d.removeEventListener('foo', cb);
		d.dispatchEvent(event('foo'));
		expect(cb).not.toHaveBeenCalled();
	});

	test('once listener is removable via returned unsubscribe function', () => {
		const d = new EventDispatcher<TestEvent>();
		const cb = vi.fn();
		const unsub = d.addEventListener('foo', cb, { once: true });
		unsub();
		d.dispatchEvent(event('foo'));
		expect(cb).not.toHaveBeenCalled();
	});

	test('removeEventListener after once listener already fired is a safe no-op', () => {
		const d = new EventDispatcher<TestEvent>();
		const cb = vi.fn();
		d.addEventListener('foo', cb, { once: true });
		d.dispatchEvent(event('foo'));
		expect(() => d.removeEventListener('foo', cb)).not.toThrow();
	});

	test('unsubscribe after once listener already fired is a safe no-op', () => {
		const d = new EventDispatcher<TestEvent>();
		const cb = vi.fn();
		const unsub = d.addEventListener('foo', cb, { once: true });
		d.dispatchEvent(event('foo'));
		expect(() => unsub()).not.toThrow();
	});

	test('once does not affect other listeners for the same type', () => {
		const d = new EventDispatcher<TestEvent>();
		const onceCb = vi.fn();
		const regularCb = vi.fn();
		d.addEventListener('foo', onceCb, { once: true });
		d.addEventListener('foo', regularCb);
		d.dispatchEvent(event('foo'));
		d.dispatchEvent(event('foo'));
		expect(onceCb).toHaveBeenCalledOnce();
		expect(regularCb).toHaveBeenCalledTimes(2);
	});

	test('same callback registered as once and regular — only the once registration auto-removes', () => {
		const d = new EventDispatcher<TestEvent>();
		const cb = vi.fn();
		d.addEventListener('foo', cb); // regular
		d.addEventListener('foo', cb, { once: true }); // once
		d.dispatchEvent(event('foo'));
		expect(cb).toHaveBeenCalledTimes(2); // both fire on first dispatch
		d.dispatchEvent(event('foo'));
		expect(cb).toHaveBeenCalledTimes(3); // only regular fires on second dispatch
	});

	test('listener added during dispatch does not fire in the same cycle', () => {
		const d = new EventDispatcher<TestEvent>();
		const laterCb = vi.fn();
		d.addEventListener('foo', () => {
			d.addEventListener('foo', laterCb);
		});
		d.dispatchEvent(event('foo'));
		expect(laterCb).not.toHaveBeenCalled(); // not fired in same dispatch
		d.dispatchEvent(event('foo'));
		expect(laterCb).toHaveBeenCalledOnce(); // fires on next dispatch
	});

	test('same callback registered as once and regular — removeEventListener removes first match', () => {
		const d = new EventDispatcher<TestEvent>();
		const cb = vi.fn();
		d.addEventListener('foo', cb); // regular (first)
		d.addEventListener('foo', cb, { once: true }); // once (second)
		d.removeEventListener('foo', cb); // removes the regular one (first match)
		d.dispatchEvent(event('foo'));
		expect(cb).toHaveBeenCalledOnce(); // once registration fires
		d.dispatchEvent(event('foo'));
		expect(cb).toHaveBeenCalledOnce(); // then auto-removed
	});

	test('signal: listener is removed when signal aborts', () => {
		const d = new EventDispatcher<TestEvent>();
		const ac = new AbortController();
		const cb = vi.fn();
		d.addEventListener('foo', cb, { signal: ac.signal });
		d.dispatchEvent(event('foo'));
		expect(cb).toHaveBeenCalledOnce();
		ac.abort();
		d.dispatchEvent(event('foo'));
		expect(cb).toHaveBeenCalledOnce(); // not called again
	});

	test('signal: listener not added if signal already aborted', () => {
		const d = new EventDispatcher<TestEvent>();
		const ac = new AbortController();
		ac.abort();
		const cb = vi.fn();
		d.addEventListener('foo', cb, { signal: ac.signal });
		d.dispatchEvent(event('foo'));
		expect(cb).not.toHaveBeenCalled();
	});

	test('signal: multiple listeners removed by single abort', () => {
		const d = new EventDispatcher<TestEvent>();
		const ac = new AbortController();
		const cb1 = vi.fn();
		const cb2 = vi.fn();
		d.addEventListener('foo', cb1, { signal: ac.signal });
		d.addEventListener('bar', cb2, { signal: ac.signal });
		ac.abort();
		d.dispatchEvent(event('foo'));
		d.dispatchEvent(event('bar'));
		expect(cb1).not.toHaveBeenCalled();
		expect(cb2).not.toHaveBeenCalled();
	});

	test('signal + once: both mechanisms coexist', () => {
		const d = new EventDispatcher<TestEvent>();
		const ac = new AbortController();
		const cb = vi.fn();
		d.addEventListener('foo', cb, { once: true, signal: ac.signal });
		d.dispatchEvent(event('foo'));
		expect(cb).toHaveBeenCalledOnce();
		// once already removed it — abort is a safe no-op
		expect(() => ac.abort()).not.toThrow();
	});

	test('signal: abort before dispatch, once listener never fires', () => {
		const d = new EventDispatcher<TestEvent>();
		const ac = new AbortController();
		const cb = vi.fn();
		d.addEventListener('foo', cb, { once: true, signal: ac.signal });
		ac.abort();
		d.dispatchEvent(event('foo'));
		expect(cb).not.toHaveBeenCalled();
	});

	test('signal: abort during dispatch still fires remaining listeners in snapshot', () => {
		const d = new EventDispatcher<TestEvent>();
		const ac = new AbortController();
		const cb1 = vi.fn(() => ac.abort());
		const cb2 = vi.fn();
		d.addEventListener('foo', cb1, { signal: ac.signal });
		d.addEventListener('foo', cb2, { signal: ac.signal });
		d.dispatchEvent(event('foo'));
		// both fire in the current cycle (snapshot iteration)
		expect(cb1).toHaveBeenCalledOnce();
		expect(cb2).toHaveBeenCalledOnce();
		// but neither fires again — abort removed them
		d.dispatchEvent(event('foo'));
		expect(cb1).toHaveBeenCalledOnce();
		expect(cb2).toHaveBeenCalledOnce();
	});

	test('signal: manual removal then abort is safe', () => {
		const d = new EventDispatcher<TestEvent>();
		const ac = new AbortController();
		const cb = vi.fn();
		const unsub = d.addEventListener('foo', cb, { signal: ac.signal });
		unsub();
		expect(() => ac.abort()).not.toThrow();
		d.dispatchEvent(event('foo'));
		expect(cb).not.toHaveBeenCalled();
	});
});
