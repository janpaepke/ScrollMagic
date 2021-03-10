// checks an object against a reference object and returns a new object containing only differences in direct descendents
const pickDifferencesFlat = <T extends Record<string, any>>(part: Partial<T>, full: T): Partial<T> => {
	const res: Partial<T> = {};
	for (const prop in part) {
		const value = part[prop];
		if (value !== full[prop]) {
			res[prop] = value;
		}
	}
	return res;
};
export default pickDifferencesFlat;
