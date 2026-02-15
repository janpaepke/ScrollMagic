export const sanitizeProperties = <T extends Record<string, any>>(obj: T, defaults: Record<string, any>): T =>
	Object.entries(obj).reduce((res, [key, value]) => {
		if (key in defaults === false) {
			if (typeof process === 'undefined' || process.env.NODE_ENV !== 'production') {
				console?.warn(`ScrollMagic Warning: Unknown property ${key} will be disregarded`);
			}
			return res;
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- value from Object.entries of generic Record
		res[key as keyof T] = value;
		return res;
	}, {} as T);
