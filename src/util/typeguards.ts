export const isWindow = (val: unknown): val is Window => val instanceof Window;
export const isHTMLElement = (val: unknown): val is HTMLElement => val instanceof HTMLElement;
export const isSVGElement = (val: unknown): val is SVGElement => val instanceof SVGElement;
