import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExecutionQueue } from '../../src/ExecutionQueue';
import { rafQueue } from '../../src/util/rafQueue';

describe('ExecutionQueue', () => {
	beforeEach(() => {
		vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);
		vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('commands execute in insertion order regardless of scheduling order', () => {
		const order: string[] = [];
		const queue = new ExecutionQueue({
			a: () => order.push('a'),
			b: () => order.push('b'),
			c: () => order.push('c'),
		});
		queue.commands.c.schedule();
		queue.commands.a.schedule();
		queue.commands.b.schedule();
		rafQueue.flush();
		expect(order).toEqual(['a', 'b', 'c']);
	});

	test('unscheduled commands are not executed', () => {
		const a = vi.fn();
		const b = vi.fn();
		const queue = new ExecutionQueue({ a, b });
		queue.commands.a.schedule();
		// b is not scheduled
		rafQueue.flush();
		expect(a).toHaveBeenCalledOnce();
		expect(b).not.toHaveBeenCalled();
	});

	test('conditional execution: condition met executes, condition not met skips', () => {
		const cb = vi.fn();
		const queue = new ExecutionQueue({ a: cb });
		queue.commands.a.schedule(() => false);
		rafQueue.flush();
		expect(cb).not.toHaveBeenCalled();

		queue.commands.a.schedule(() => true);
		rafQueue.flush();
		expect(cb).toHaveBeenCalledOnce();
	});

	test('unconditional schedule clears previous conditions', () => {
		const cb = vi.fn();
		const queue = new ExecutionQueue({ a: cb });
		// first schedule with a condition that would fail
		queue.commands.a.schedule(() => false);
		// second schedule without condition (unconditional) — should override
		queue.commands.a.schedule();
		rafQueue.flush();
		expect(cb).toHaveBeenCalledOnce();
	});

	test('multiple conditions: any true condition causes execution', () => {
		const cb = vi.fn();
		const queue = new ExecutionQueue({ a: cb });
		queue.commands.a.schedule(() => false);
		queue.commands.a.schedule(() => true);
		rafQueue.flush();
		expect(cb).toHaveBeenCalledOnce();
	});

	test('cancel prevents execution', () => {
		const cb = vi.fn();
		const queue = new ExecutionQueue({ a: cb });
		queue.commands.a.schedule();
		queue.cancel();
		rafQueue.flush();
		expect(cb).not.toHaveBeenCalled();
	});

	test('scheduling triggers the rafQueue', () => {
		const scheduleSpy = vi.spyOn(rafQueue, 'schedule');
		const queue = new ExecutionQueue({ a: vi.fn() });
		queue.commands.a.schedule();
		expect(scheduleSpy).toHaveBeenCalledWith(queue);
	});

	test('command scheduled multiple times executes only once per flush', () => {
		const cb = vi.fn();
		const queue = new ExecutionQueue({ a: cb });
		queue.commands.a.schedule();
		queue.commands.a.schedule();
		queue.commands.a.schedule();
		rafQueue.flush();
		expect(cb).toHaveBeenCalledOnce();
	});

	test('conditions are reset after execution', () => {
		const cb = vi.fn();
		const queue = new ExecutionQueue({ a: cb });
		queue.commands.a.schedule();
		rafQueue.flush();
		expect(cb).toHaveBeenCalledOnce();
		// second flush without re-scheduling — should not execute
		cb.mockClear();
		rafQueue.flush();
		expect(cb).not.toHaveBeenCalled();
	});
});
