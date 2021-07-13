export const isNumber = (val: unknown): val is number => typeof val === 'number';
export const isString = (val: unknown): val is string => typeof val === 'string';
export const isUndefined = (val: unknown): val is undefined => undefined === val;
export const isNull = (val: unknown): val is null => null === val;
export const isWindow = (val: unknown): val is Window => val instanceof Window;
export const isHTMLElement = (val: unknown): val is HTMLElement => val instanceof HTMLElement;
export const isSVGElement = (val: unknown): val is SVGElement => val instanceof SVGElement;
