/**
 * Runs a transformation callback against all key/value pairs.
 * Essentially a shorthand for Object.fromEntries(Object.entries(x).map(y)), but it preserves the key type.
 */
export function transformObject<
	T extends Record<string | number | symbol, unknown>,
	R extends [key: string | number | symbol, value: unknown],
>(object: T, transform: (entry: [key: keyof T, value: T[keyof T]]) => R) {
	return Object.fromEntries(
		Object.entries(
			object as Record<keyof T, T[keyof T]> // some type vodoo to get entries to infer the correct type
		).map(transform)
	) as Record<R[0], R[1]>;
}
