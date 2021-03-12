export type ValidationRule<I, O> = {
	normalize?: (value: I) => O; // if there's no normalize, we'll assume the input type is compatible with the output
	check?: (value: O) => void | O | ((value: O) => void | O)[];
};

export type ValidationRules<
	I extends { [X in keyof I & keyof O]: any },
	O extends { [X in keyof I & keyof O]: any }
> = {
	[X in keyof I & keyof O]?: ValidationRule<I[X], O[X]>;
};
/**
 * A function that can be used to validate the properties of an object based on predefined rules.
 * @param options the object that should be validated
 * @param rules an object with matching keys, which defines how to normalize and or validate a property
 * @param fail A function that returns the format for the error message, should normalize or check fail.
 * @returns the normalized and checked object
 */
const validateObject = <I extends { [X in K]: any }, O extends { [X in K]: any }, K extends keyof I & keyof O>(
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
			//TODO: reeeaaally forcing it. should be better with planned batch structure.
			clean = ((normalize?.(value) ?? value) as unknown) as O[K];
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
