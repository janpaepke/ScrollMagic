const SM = 'ScrollMagic';
export class ScrollMagicError extends Error {
	public readonly name = `${SM}Error`;
	constructor(message: string) {
		super(message);
	}
}
export class ScrollMagicErrorInternal extends ScrollMagicError {
	constructor(message: string) {
		super(`Internal Error: ${message}`);
	}
}
export const failWith = (message: string): ScrollMagicError => {
	return new ScrollMagicError(message);
};
export const failWithInternal = (message: string): ScrollMagicErrorInternal => {
	return new ScrollMagicErrorInternal(message);
};
export const warn = (first: unknown, ...args: unknown[]): void => {
	console?.warn(`${SM} Warning: ${first}`, ...args);
};
