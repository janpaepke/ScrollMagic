// Object.fromEntries replacement, but with an optional callback, which is applied to each value

export function fromEntries<V extends any>(entries: Array<[string, V]>): { [key: string]: V };

export function fromEntries<V extends any, C extends ((value: V) => any) | undefined>(
	entries: Array<[string, V]>,
	processValue: C
): { [key: string]: ReturnType<NonNullable<C>> };

export function fromEntries<V extends any, C extends ((value: V) => any) | undefined>(
	entries: Array<[string, V]>,
	processValue?: C
): { [key: string]: V | ReturnType<NonNullable<C>> } {
	return entries.reduce(
		(obj, [key, value]) => ({ ...obj, [key]: undefined === processValue ? value : processValue(value) }),
		{}
	);
}
