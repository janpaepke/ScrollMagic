export const waitForFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
export const waitForFrames = async (n = 3) => {
	for (let i = 0; i < n; i++) await waitForFrame();
};
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const cleanup = () => {
	document.body.innerHTML = '';
	window.scrollTo(0, 0);
};

/** Standard setup: scrollable page with a positioned target element (window scroll) */
export const setupWindow = (opts: { contentHeight?: number; elementTop?: number; elementHeight?: number } = {}) => {
	const { contentHeight = 3000, elementTop = 1000, elementHeight = 200 } = opts;
	document.body.style.margin = '0';
	document.body.style.padding = '0';

	const spacer = document.createElement('div');
	spacer.style.height = `${contentHeight}px`;
	spacer.style.position = 'relative';

	const target = document.createElement('div');
	target.style.position = 'absolute';
	target.style.top = `${elementTop}px`;
	target.style.height = `${elementHeight}px`;
	target.style.width = '100%';

	spacer.appendChild(target);
	document.body.appendChild(spacer);
	return { spacer, target };
};

/** Setup: scrollable container div (non-window scroll parent) */
export const setupContainer = (
	opts: {
		containerHeight?: number;
		contentHeight?: number;
		elementTop?: number;
		elementHeight?: number;
		containerCss?: Partial<CSSStyleDeclaration>;
	} = {}
) => {
	const { containerHeight = 400, contentHeight = 2000, elementTop = 800, elementHeight = 100, containerCss = {} } = opts;
	document.body.style.margin = '0';
	document.body.style.padding = '0';

	const container = document.createElement('div');
	container.style.height = `${containerHeight}px`;
	container.style.overflow = 'auto';
	container.style.position = 'relative';
	Object.assign(container.style, containerCss);

	const content = document.createElement('div');
	content.style.height = `${contentHeight}px`;
	content.style.position = 'relative';

	const target = document.createElement('div');
	target.style.position = 'absolute';
	target.style.top = `${elementTop}px`;
	target.style.height = `${elementHeight}px`;
	target.style.width = '100%';

	content.appendChild(target);
	container.appendChild(content);
	document.body.appendChild(container);
	return { container, content, target };
};
