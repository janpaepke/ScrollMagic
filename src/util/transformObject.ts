import { assignEntry } from './assignEntry';

// runs a transformation callback against all key/value pairs
export const transformObject = <
	T extends { [key: string]: any },
	C extends (entry: [key: keyof T, value: T[keyof T]]) => [key: string, value: any]
>(
	obj: T,
	transform: C
): { [K in ReturnType<C>[0]]: ReturnType<C>[1] } =>
	Object.entries(obj).reduce<any>((obj, entry) => assignEntry(obj, transform(entry)), {});
