export const debounce = <F extends (...args: any) => ReturnType<F>>(func: F, wait: number) => {
	let timeoutId = 0; // setTimeout returns positive integer, so 0 represents no call requested

	const debounced = function (this: ThisParameterType<F>, ...args: Parameters<F>) {
		clearTimeout(timeoutId);
		timeoutId = window.setTimeout(() => {
			timeoutId = 0;
			func.apply(this, args);
		}, wait);
	};

	debounced.cancel = function () {
		clearTimeout(timeoutId);
		timeoutId = 0;
	};

	return debounced as ((...args: Parameters<F>) => ReturnType<F>) & { cancel: () => void };
};
