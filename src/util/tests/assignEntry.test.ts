import { assignEntry } from '../assignEntry';

test('returns merged Object and modifies original', () => {
	const x = { a: 1 };
	expect(assignEntry(x, ['b', 2])).toStrictEqual<{ a: number; b: number }>({ a: 1, b: 2 }); // extend
	expect(x).toStrictEqual({ a: 1, b: 2 }); // modify original
	expect(assignEntry({ a: 1 }, ['a', 2])).toStrictEqual<{ a: number }>({ a: 2 }); // overwrite
});
