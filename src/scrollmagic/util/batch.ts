/**
 * -> first function expects parameters of any type
 * -> Each function expets return type of previous function
 * -> the result of the last function is returned as the batch result
 * https://stackoverflow.com/questions/53173203/typescript-recursive-function-composition
 */
function batch<Z, A extends any, R1, R2, R3, R4, R5, R6>(
	this: Z,
	...callbacks: [
		(this: Z, value: A) => R1,
		(this: Z, value: R1) => R2,
		(this: Z, value: R2) => R3,
		(this: Z, value: R3) => R4,
		(this: Z, value: R4) => R5,
		(this: Z, value: R5) => R6
	]
): (this: Z, value: A) => R6;
function batch<Z, A extends any, R1, R2, R3, R4, R5>(
	this: Z,
	...callbacks: [
		(this: Z, value: A) => R1,
		(this: Z, value: R1) => R2,
		(this: Z, value: R2) => R3,
		(this: Z, value: R3) => R4,
		(this: Z, value: R4) => R5
	]
): (this: Z, value: A) => R5;
function batch<Z, A extends any, R1, R2, R3, R4>(
	this: Z,
	...callbacks: [
		(this: Z, value: A) => R1,
		(this: Z, value: R1) => R2,
		(this: Z, value: R2) => R3,
		(this: Z, value: R3) => R4
	]
): (this: Z, value: A) => R4;
function batch<Z, A extends any, R1, R2, R3>(
	this: Z,
	...callbacks: [(this: Z, value: A) => R1, (this: Z, value: R1) => R2, (this: Z, value: R2) => R3]
): (this: Z, value: A) => R3;
function batch<Z, A extends any, R1, R2>(
	this: Z,
	...callbacks: [(this: Z, value: A) => R1, (this: Z, value: R1) => R2]
): (this: Z, value: A) => R2;
function batch<Z, A extends any, R1>(this: Z, ...callbacks: [(this: Z, value: A) => R1]): (this: Z, value: A) => R1;
function batch<Z, A extends any, R1>(this: Z, ...callbacks: [(this: Z, value: A) => R1]): (this: Z, value: A) => R1 {
	return function (value: A) {
		let result: any = value;
		callbacks.forEach(callback => {
			result = callback.call(this, result);
		});
		return result;
	};
}
export { batch };
