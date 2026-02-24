import { transformObject } from './transformObject';

// { agnosticProp: [verticalProp, horizontalProp] }
const translationMap = {
	start: ['top', 'left'],
	end: ['bottom', 'right'],
	size: ['height', 'width'],
	clientSize: ['clientHeight', 'clientWidth'],
	scrollSize: ['scrollHeight', 'scrollWidth'],
	axis: ['y', 'x'],
} as const;

type TranslationMap = typeof translationMap;
type AgnosticProps = keyof TranslationMap;
type TranslateProp<K extends AgnosticProps, V extends boolean> = TranslationMap[K][V extends true ? 0 : 1];
type Vertical = { [K in AgnosticProps]: TranslateProp<K, true> };
type Horizontal = { [K in AgnosticProps]: TranslateProp<K, false> };

// cache props
const flat = (index: number) => transformObject(translationMap, ([key, value]) => [key, value[index]]);
const propsV = flat(0) as Vertical;
const propsH = flat(1) as Horizontal;

/**
 * Returns a map of direction-agnostic property names to their orientation-specific counterparts.
 * @param vertical - Scroll direction (`true` = vertical, `false` = horizontal).
 * @returns A mapping like `{ start: 'top', size: 'height', ... }` for vertical, or `{ start: 'left', size: 'width', ... }` for horizontal.
 */
export function agnosticProps(vertical: true): Vertical;
export function agnosticProps(vertical: false): Horizontal;
export function agnosticProps(vertical: boolean): Vertical | Horizontal;
export function agnosticProps(vertical: boolean): Vertical | Horizontal {
	return vertical ? propsV : propsH;
}

type MatchProp<K extends string, T extends Record<string, unknown>> = K extends keyof T ? T[K] : never;
type GetType<V extends boolean, T extends Record<string, unknown>> = {
	[K in AgnosticProps]: MatchProp<TranslateProp<K, V>, T>;
};
/**
 * Extracts direction-relevant values from an object using orientation-aware property names.
 *
 * For vertical: `top` → `start`, `height` → `size`, `y` → `axis`, etc.
 * For horizontal: `left` → `start`, `width` → `size`, `x` → `axis`, etc.
 *
 * @param vertical - Scroll direction (`true` = vertical, `false` = horizontal).
 * @param obj - Source object to extract values from (e.g. a `DOMRect` or scroll delta).
 * @returns An object with agnostic keys (`start`, `end`, `size`, `clientSize`, `scrollSize`, `axis`) mapped to the corresponding values.
 */
export const agnosticValues = <V extends boolean, T extends { [key: string]: any }>(
	vertical: V,
	obj: T
): GetType<V, T> => transformObject(agnosticProps(vertical), ([key, value]) => [key, obj[value]]);
