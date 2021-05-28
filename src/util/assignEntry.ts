type FromEntry<E extends [string, any]> = {
	[X in E[0]]: E[1];
};

// assigns an entry [key, value] to an object, modifying the original and returning it
export const assignEntry = <O extends { [key: string]: any }, E extends [string, any]>(
	obj: O,
	[key, value]: E
): O & FromEntry<E> =>
	Object.assign(obj, {
		[key]: value,
	});
