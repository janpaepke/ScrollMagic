export const sanitizeProperties = <T extends Record<string, any>>(
	obj: Record<string, any>,
	defaults: T,
	onUnknown?: (propertyName: string) => void
): Partial<T> =>
	Object.entries(obj).reduce((res, [key, value]) => {
		if (key in defaults === false) {
			onUnknown?.(key);
			return res;
		}
		res[key as keyof T] = value;
		return res;
	}, {} as Partial<T>);
