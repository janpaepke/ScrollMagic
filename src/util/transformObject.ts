/**
 * Type-safe `Object.fromEntries(Object.entries(obj).map(fn))`.
 * The generics preserve key/value types through the transformation, avoiding manual casts at call sites.
 */
export function transformObject<
	T extends Record<string | number | symbol, unknown>,
	R extends [key: string | number | symbol, value: unknown],
>(object: T, transform: (entry: [key: keyof T, value: T[keyof T]]) => R) {
	return Object.fromEntries(
		Object.entries(object as Record<keyof T, T[keyof T]>).map(transform)
	) as Record<R[0], R[1]>;
}
