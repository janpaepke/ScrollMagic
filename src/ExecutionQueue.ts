import { throttleRaf } from './util/throttleRaf';
import { isUndefined } from './util/typeguards';

type Command = () => void;
type ExecutionCondition = () => boolean;
type CommandList<T extends string> = Record<T, QueueItem>;

/**
 * TODO! Update - this is very different now
 * Holds a list of commands and execute them in order.
 * If a command is added twice before executing, it will stay in the order position as before.
 * Caveats:
 * - can't override commands with existing precondition
 */

class QueueItem {
	protected conditions: ExecutionCondition[] = [];
	constructor(public readonly execute: Command, protected readonly onSchedule: () => void) {}
	public schedule(condition?: ExecutionCondition) {
		if (isUndefined(condition)) {
			// if no condition is provided, conditions are considered always met. Any conditions added after this won't even be run
			this.conditions = [];
			condition = () => true;
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

export class ExecutionQueue<C extends string> {
	public readonly commands: CommandList<C>;
	protected executeThrottled = throttleRaf(this.execute.bind(this));

	constructor(queueItems: Record<C, Command>) {
		this.commands = Object.entries<Command>(queueItems).reduce(
			(res, [name, command]) => ({
				...res,
				[name]: new QueueItem(command, this.executeThrottled),
			}),
			{} as CommandList<C>
		);
	}

	// executes all commands in the list in order, depending on wether or not their conditions are met
	public execute(): void {
		Object.values<QueueItem>(this.commands).forEach(item => {
			if (item.conditionsMet) {
				item.execute();
			}
			item.resetConditions();
		});
	}
	public cancel(): void {
		this.executeThrottled.cancel();
	}
}
