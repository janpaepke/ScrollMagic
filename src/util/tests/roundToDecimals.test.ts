import { roundToDecimals } from '../roundToDecimals';

test('rounds to a set number of decimals', () => {
	expect(roundToDecimals(1.12333123, 2)).toBe(1.12);
	expect(roundToDecimals(1.12333123, 0)).toBe(1);
	expect(roundToDecimals(1, 2)).toBe(1);
});
