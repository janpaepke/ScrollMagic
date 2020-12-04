export const isWindow = (elem: any): elem is Window => window === elem;
export const isDocument = (elem: any): elem is Document => window.document === elem;
