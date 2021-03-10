import { ScrollMagicOptions, ScrollMagicOptionsInternal } from './Scene';
import getElement from './util/getElement';
import getScrollContainerElement from './util/getScrollContainerElement';

type Rule<I, O> = {
	normalize?: (value: I) => O; // if there's no normalize, we'll assume the input type is compatible with the output
	validate?: (value: O) => void | ((value: O) => void)[];
};

type Rules<T extends { [K in keyof P]?: any }, P extends { [K in keyof T]: any }> = {
	[K in keyof T]?: Rule<T[K], P[K]>;
};

const assert = (condition: boolean, message?: string) => {
	if (!condition) {
		throw new Error(message);
	}
};

const betweenZeroAndOne = (val: number) => assert(Math.abs(val) <= 1, 'Value must be a number between 0 and 1.');

const rules: Rules<Required<ScrollMagicOptions>, ScrollMagicOptionsInternal> = {
	element: {
		normalize: val => getElement(val),
	},
	scrollParent: {
		normalize: val => getScrollContainerElement(val),
	},
	trackStart: {
		validate: betweenZeroAndOne,
	},
	trackEnd: {
		validate: betweenZeroAndOne,
	},
};
// a class designed to explicitely check and normalize scrollmagic opttions.
class OptionsValidator {
	static checkOptions<I extends ScrollMagicOptions, O extends ScrollMagicOptionsInternal>(
		options: Partial<I>
	): Partial<O> {
		return Object.keys(options).reduce((result, key) => {
			const { normalize, validate } = rules[key as keyof typeof rules] ?? {};
			const value = options[key as keyof I]!;
			// @ts-expect-error
			const clean = normalize?.(value) ?? value;
			try {
				if (Array.isArray(validate)) {
					validate.forEach(val => val(clean));
				}
				//@ts-expect-error
				validate?.(clean);
			} catch (e) {
				throw new Error(`Invalid value ${value} for option ${key}. ${e.message}`);
			}
			//@ts-expect-error
			result[key as keyof O] = clean;
			return result;
		}, {} as Partial<O>);
	}
}
export default OptionsValidator;
