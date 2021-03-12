export const isWindow = (elem: any): elem is Window => window === elem;
export const isDocument = (elem: any): elem is Document => window.document === elem;
export const isNumber = (val: any): val is number => typeof val === 'number';
export const isString = (val: any): val is string => typeof val === 'string';
