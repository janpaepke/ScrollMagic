export const isWindow = (elem: unknown): elem is Window => window === elem;
export const isDocument = (elem: unknown): elem is Document => window.document === elem;
export const isNumber = (val: unknown): val is number => typeof val === 'number';
export const isString = (val: unknown): val is string => typeof val === 'string';
export const isNode = (val: unknown): val is Node =>
	(val as Node).nodeType === 1 && typeof (val as Node).nodeName === 'string';
export const isHTMLElement = (val: unknown): val is HTMLElement =>
	typeof HTMLElement === 'object' || typeof HTMLElement === 'function'
		? // TODO: SVG Element also okay?
		  val instanceof HTMLElement // || o instanceof SVGElement //DOM2
		: typeof val === 'object' && val !== null && isNode(val);
