export class ScrollMagicError extends Error {
	public override readonly name: string = 'ScrollMagicError';
	public get [Symbol.toStringTag]() {
		return this.name;
	}
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
	}
}
export class ScrollMagicInternalError extends ScrollMagicError {
	public override readonly name = 'ScrollMagicInternalError';
	constructor(message: string, options?: ErrorOptions) {
		super(`Internal Error: ${message}`, options);
	}
}
