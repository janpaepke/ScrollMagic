export const debounce = <F extends (...args: unknown[]) => any>(func: F, wait: number): F & { cancel: () => void } => {
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	const debounced = function (this: ThisParameterType<F>, ...args: Parameters<F>) {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			timeoutId = undefined;
			func.apply(this, args);
		}, wait);
	};

	debounced.cancel = function () {
		clearTimeout(timeoutId);
		timeoutId = undefined;
	};

	return debounced as F & { cancel: () => void };
};
