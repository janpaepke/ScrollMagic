import { warn } from 'scrollmagic/ScrollMagicError';

export const sanitizeProperties = <T extends Record<string, any>>(
	obj: Record<string, any>,
	defaults: T,
	onUnknown = (propertyName: string) => {
		warn(`Unknown property ${propertyName} will be disregarded`);
	}
): Partial<T> =>
	Object.entries(obj).reduce((res, [key, value]) => {
		if (key in defaults === false) {
			onUnknown?.(key);
			return res;
		}
		res[key as keyof T] = value;
		return res;
	}, {} as Partial<T>);
