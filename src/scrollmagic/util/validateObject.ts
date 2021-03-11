export type ValidationRule<I, O> = {
	normalize?: (value: I) => O; // if there's no normalize, we'll assume the input type is compatible with the output
	check?: (value: O) => void | ((value: O) => void)[];
};

export type ValidationRules<I extends { [K in keyof I]: any }, O extends { [K in keyof I]: any }> = {
	[K in keyof I]?: ValidationRule<I[K], O[K]>;
};
/**
 * A function that can be used to validate the properties of an object based on predefined rules.
 * @param options the object that should be validated
 * @param rules an object with matching keys, which defines how to normalize and or validate a property
 * @param fail A function that returns the format for the error message, should normalize or check fail.
 * @returns the normalized and checked object
 */
const validateObject = <I extends { [K in keyof I]: any }, O extends { [K in keyof I]: any }, K extends keyof I>(
	options: Partial<I>,
	rules: ValidationRules<I, O>,
	fail: (value: any, prop: K, reason?: string) => string = (value, prop, reason) =>
		`Invalid value ${value} for option ${prop}. ${reason}`
): O => {
	return Object.keys(options).reduce((result, key) => {
		const prop = key as K;
		const { normalize, check } = rules[prop] ?? {};
		const value = options[prop] as I[K];
		let clean: O[K];
		try {
			clean = normalize?.(value) ?? value; // no normalizer? let's assume input type matches output
			if (Array.isArray(check)) {
				check.forEach(val => val(clean));
			}
			check?.(clean);
		} catch (e) {
			throw new Error(fail(value, prop, e.message));
		}
		result[prop] = clean;
		return result;
	}, {} as O);
};
export default validateObject;
