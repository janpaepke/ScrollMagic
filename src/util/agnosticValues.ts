import { transformObject } from './transformObject';

// { agnosticProp: [verticalProp, horizontalProp] }
const translationMap = {
	start: ['top', 'left'],
	end: ['bottom', 'right'],
	size: ['height', 'width'],
	clientSize: ['clientHeight', 'clientWidth'],
	scrollSize: ['scrollHeight', 'scrollWidth'],
	scrollDelta: ['deltaY', 'deltaX'],
} as const;

type TranslationMap = typeof translationMap;
type AgnosticProps = keyof TranslationMap;
type Translate<K extends AgnosticProps, V extends boolean> = TranslationMap[K][V extends true ? 0 : 1];
type Vertical = { [K in AgnosticProps]: Translate<K, true> };
type Horizontal = { [K in AgnosticProps]: Translate<K, false> };

// cache props
const flat = (index: number) => transformObject(translationMap, ([key, value]) => [key, value[index]]);
const propsV = flat(0) as Vertical;
const propsH = flat(1) as Horizontal;

/**
 * Returns a map of agnostic props and their translation depending on vertical or horizontal orientation.
 * @param vertical scrolldirection (true = vertical)
 */
export const agnosticProps = (vertical: boolean): Vertical | Horizontal => (vertical ? propsV : propsH);

type MatchProp<K extends string, T extends Record<string, unknown>> = K extends keyof T ? T[K] : never;
type GetType<V extends boolean, T extends Record<string, unknown>> = {
	[K in AgnosticProps]: MatchProp<Translate<K, V>, T>;
};
/**
 * Returns the relevant boundary values depending on vertical or horizontal orientation.
 * I.E. top or left value => start, width / height => size.
 * The equivalent return value (start) is dependent on wether or not the respective source prop (top / left) is present in the source object
 * @param vertical scrolldirection (true = vertical)
 * @param obj Object to tretrieve the values from
 */
export const agonosticValues = <V extends boolean, T extends { [key: string]: any }>(
	vertical: V,
	obj: T
): GetType<V, T> => transformObject(agnosticProps(vertical), ([key, value]) => [key, obj[value]]);
