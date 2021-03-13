// TODO: this will also allow missing rules, if input and output property types don't match. Maybe we can do better?
export type PropertyProcessors<
	I extends { [X in keyof I & keyof O]: unknown },
	O extends { [X in keyof I & keyof O]: unknown }
> = { [X in keyof I & keyof O]?: (value: I[X]) => O[X] };
/**
 * A function that can be used to validate the properties of an object based on predefined rules.
 * @param options the object that should be validated
 * @param rules an object with matching keys, which defines how to normalize and or validate a property
 * @param fail A function that returns the format for the error message, should normalize or check fail.
 * @returns the normalized and checked object
 */

const processProperties = <
	I extends { [X in keyof I]: any },
	P extends { [X in K]: (value: Required<I>[X]) => any },
	O extends { [X in K]: ReturnType<P[X]> },
	K extends keyof I
>(
	options: I,
	rules: P, // ValidationProcessors<I, O>,
	fail: (value: any, prop: keyof I, reason?: string) => string = (value, prop, reason) =>
		`Invalid value ${value} for option ${prop}. ${reason}`
): O => {
	return Object.keys(options).reduce((result, key) => {
		const prop = key as K;
		const value = options[prop];
		const processor = rules[prop];
		let processedValue: O[K];
		try {
			processedValue = processor?.(value) ?? (value as O[K]);
		} catch (e) {
			throw new Error(fail(value, prop, e.message));
		}
		result[prop] = processedValue;
		return result;
	}, {} as O);
};
export default processProperties;
