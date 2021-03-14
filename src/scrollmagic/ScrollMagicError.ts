export class ScrollMagicError extends Error {
	public readonly name = 'ScrollMagicError';
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
