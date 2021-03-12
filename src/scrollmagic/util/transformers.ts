export const numberToPercString = (val: number): string => `${val * 100}%`;
export const stringToUnitTuple = (val: string): [value: number, unit: string] => {
	// if unit is %, value will be 1 for 100%
	const match = val.match(/^(\d+|\d*[.]\d+)(%|px)$/);
	if (match === null) {
		throw new Error(`Can't convert supplied string value to unit Tuple.`);
	}
	const value = parseFloat(match[1]);
	const unit = match[2];
	return [unit === 'px' ? value : value / 100, unit];
};
