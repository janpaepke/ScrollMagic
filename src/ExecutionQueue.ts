import { rafQueue } from './util/rafQueue';
import { transformObject } from './util/transformObject';
type Callback = () => void;
type ExecutionCondition = () => boolean;
const always: ExecutionCondition = () => true;
type CommandList<T extends string> = Record<T, Command>;

/**
 * This class holds a list of callbacks allows them to be scheduled for execution on next animationFrame.
 * Every callback will only be executed once per animationFrame, even if scheduled multiple times.
 * The order of the queue superceeds the order of scheduling, this means that if the queue consists of callbacks a, b,
 * a will always execute first, even if b is scheduled first.
 *
 * usage example:
 * ```
 * const queue = new ExecutionQueue({
 * 		a: () => console.log('a');
 * 		b: () => console.log('b');
 * })
 * queue.commands.b.schedule();
 * queue.commands.a.schedule();
 * <expected output on animationFrame>
 * 'a'
 * 'b'
 * ```
 *
 * For details about conditional execution see Command class below.
 *
 * To invoke execution now (and purge scheduled), call queue.execute.
 * To cancel scheduled execution, call queue.cancel
 */
export class ExecutionQueue<C extends string> {
	public readonly commands: CommandList<C>;

	constructor(queueItems: Record<C, Callback>) {
		this.commands = transformObject(queueItems, ([key, command]) => [key, new Command(command, () => rafQueue.schedule(this))]);
	}

	// executes all commands in the list in order, depending on whether or not their conditions are met
	public execute(): void {
		Object.values<Command>(this.commands).forEach(item => {
			if (item.conditionsMet) {
				item.execute();
			}
			item.resetConditions();
		});
	}
	public cancel(): void {
		rafQueue.unschedule(this);
	}
}

/**
 * Each command in the ExecutionQueue above can be scheduled for execution using command.schedule()
 * .schedule() also accepts an optional parameter, a condition callback
 * This is called when execution is due, to determine if the callback should still be called.
 *
 * usage example:
 * ```
 * let x = 1;
 * const queue = new ExecutionQueue({
 * 		a: () => {
 * 			x = 2;
 * 			console.log('a');
 * 		};
 * 		b: () => console.log('b');
 * })
 * // result of execution condition remains true
 * queue.commands.b.schedule(() => x === 1);
 * <expected output on animationFrame>
 * 'b'
 * // x is 1 now, but will be 2, once a has been called.
 * queue.commands.a.schedule();
 * queue.commands.b.schedule(() => x === 1);
 * <expected output on animationFrame>
 * 'a'
 * ```
 */
class Command {
	protected conditions: ExecutionCondition[] = [];
	constructor(
		public readonly execute: Callback,
		protected readonly onSchedule: () => void
	) {}
	public schedule(condition?: ExecutionCondition) {
		if (undefined === condition) {
			// if no condition is provided, conditions are considered always met. Any conditions added after this won't even be run
			this.conditions = [];
			condition = always;
		}
		this.conditions.push(condition);
		this.onSchedule();
	}
	public resetConditions() {
		this.conditions = [];
	}
	public get conditionsMet() {
		return this.conditions.some(condition => condition());
	}
}
