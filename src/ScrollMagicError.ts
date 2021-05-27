export class ScrollMagicError extends Error {
	public readonly name = `ScrollMagicError`;
	constructor(message: string) {
		super(message);
	}
}
class ScrollMagicErrorInternal extends ScrollMagicError {
	constructor(message: string) {
		super(`Internal Error: ${message}`);
	}
}
export const makeError = (message: string, internal = false): ScrollMagicError => {
	return internal ? new ScrollMagicErrorInternal(message) : new ScrollMagicError(message);
};
export const warn = (first: unknown, ...args: unknown[]): void => {
	console?.warn(`ScrollMagic Warning: ${first}`, ...args);
};
