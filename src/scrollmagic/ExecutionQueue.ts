import throttleRaf from './util/throttleRaf';

type Command = () => void;
type Prerequisite = () => boolean;

/**
 * Holds a list of commands and execute them in order.
 * If a command is added twice before executing, it will stay in the order position as before.
 * Caveats:
 * - can't override commands with existing precondition
 */

export class ExecutionQueue {
	protected readonly commands = new Map<Command, Prerequisite | null>(); // in js: remembers the original insertion order
	public execute(): void {
		this.commands.forEach((prerequisite, command) => {
			if (false === prerequisite?.()) {
				return;
			}
			command();
		});
	}
	public add(command: Command, prerequisite?: Prerequisite): void {
		const existing = this.commands.get(command);
		if (null === existing) {
			// currently we can only go from has prerequisite to no prerequisite (get less strict)
			return;
		}
		this.commands.set(command, prerequisite ?? null);
	}
	public remove(command: Command): boolean {
		return this.commands.delete(command);
	}
	public clear(): void {
		this.commands.clear();
	}
}

export class ThrottledExecutionQueue extends ExecutionQueue {
	protected executeThrottled = throttleRaf(this.execute.bind(this));
	// adds a command to the queue and schedules it for execution
	public schedule(command: Command, prerequisite?: Prerequisite): void {
		this.add(command, prerequisite);
		this.executeThrottled();
	}
	// exedcutes the whole queue immediately
	public moveUp(): void {
		this.executeThrottled.cancel();
		this.execute();
	}
	public clear(): void {
		this.executeThrottled.cancel();
		super.clear();
	}
}
