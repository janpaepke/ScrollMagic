import { fromEntries } from './fromEntries';

export const processValues = <T extends { [key: string]: any }, C extends (value: T[keyof T]) => any>(
	obj: T,
	callback: C
): { [K in keyof T]: ReturnType<C> } => fromEntries(Object.entries(obj), callback) as any;
