const throttleRaf = <F extends (...a: any) => any>(func: F) => {
	let requestId = 0; // rAF returns non-zero values, so 0 represents no request pending

	const throttled = function (this: ThisParameterType<F>, ...args: Parameters<F>) {
		if (0 === requestId) {
			requestId = requestAnimationFrame(() => {
				requestId = 0;
				func.apply(this, args);
			});
		}
	};

	throttled.cancel = () => {
		cancelAnimationFrame(requestId);
		requestId = 0;
	};
	return throttled as ((...a: Parameters<F>) => ReturnType<F>) & { cancel: () => void };
};

export default throttleRaf;
