const fromEntries = <T extends { [key: string]: any }>(obj: T, [key, value]: [string, any]) => ({
	...obj,
	[key]: value,
});
// checks an object against a reference object and returns a new object containing only differences in direct descendents (one way!)
const pickDifferencesFlat = <T extends Record<string, any>>(part: Partial<T>, full: T): Partial<T> =>
	Object.entries(part)
		.filter(([key, value]) => value !== full[key])
		.reduce(fromEntries, {});
export default pickDifferencesFlat;
