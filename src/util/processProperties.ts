import { ScrollMagicError } from '../ScrollMagicError';

// type to ensure there's an output processor for every input
export type PropertyProcessors<I extends { [X in keyof I]: unknown }, O extends { [X in keyof I]: unknown }> = {
	[X in keyof I]: (value: Required<I>[X]) => O[X];
};

/**
 * A function that can be used to validate the properties of an object based on predefined rules.
 * @param obj the object that should be processed
 * @param processors an object with matching keys, which defines how to normalize and or validate a property
 * @param getErrorMessage A function that returns the format for the error message, should normalize or check fail.
 * @returns the normalized and checked object
 */

export const processProperties = <
	I extends { [X in keyof I]: any },
	P extends { [X in K]?: (value: Required<I>[X]) => any },
	O extends { [X in K]: P[X] extends (...args: any[]) => infer R ? R : I[X] },
	K extends keyof I,
>(
	obj: I,
	processors: P,
	getErrorMessage: (value: unknown, prop: keyof I) => string = (value, prop) =>
		`Invalid value ${String(value)} for ${String(prop)}.`
): O => {
	return Object.keys(obj).reduce((result, key) => {
		const prop = key as K;
		const value = obj[prop];
		const processor = processors[prop];
		let processedValue: O[K];
		try {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- generic processor output is intentionally any
			processedValue = processor?.(value) ?? value;
		} catch (e: unknown) {
			const reason = e instanceof ScrollMagicError ? ` ${e.message}` : '';
			throw new ScrollMagicError(getErrorMessage(value, prop) + reason, { cause: e });
		}
		result[prop] = processedValue;
		return result;
	}, {} as O);
};
