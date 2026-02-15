import { warn } from '../ScrollMagicError';

export const sanitizeProperties = <T extends Record<string, any>>(
	obj: T,
	defaults: Record<string, any>,
	onUnknown = (propertyName: string) => {
		warn(`Unknown property ${propertyName} will be disregarded`);
	}
): T =>
	Object.entries(obj).reduce((res, [key, value]) => {
		if (key in defaults === false) {
			onUnknown?.(key);
			return res;
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- value from Object.entries of generic Record
		res[key as keyof T] = value;
		return res;
	}, {} as T);
