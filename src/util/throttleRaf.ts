export const throttleRaf = <F extends (...a: unknown[]) => any>(
	func: F
): ((this: ThisParameterType<F>, ...args: Parameters<F>) => void) & {
	cancel: () => void;
} => {
	let requestId = 0; // rAF returns non-zero values, so 0 represents no request pending

	const scheduled = function (this: ThisParameterType<F>, ...args: Parameters<F>) {
		if (0 !== requestId) {
			return;
		}
		requestId = requestAnimationFrame(() => {
			requestId = 0;
			func.apply(this, args);
		});
	};

	scheduled.cancel = () => {
		cancelAnimationFrame(requestId);
		requestId = 0;
	};
	return scheduled;
};
