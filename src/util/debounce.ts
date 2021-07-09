export const debounce = <F extends (...args: any) => any>(func: F, wait: number): F & { cancel: () => void } => {
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

	return debounced as F & { cancel: () => void };
};
