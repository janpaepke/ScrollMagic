import { processValues } from './processValues';

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
type Vertical = { [X in AgnosticProps]: TranslationMap[X][0] };
type Horizontal = { [X in AgnosticProps]: TranslationMap[X][1] };

const flat = (index: number) => processValues(translationMap, value => value[index]);
const propsV = flat(0) as Vertical;
const propsH = flat(1) as Horizontal;

/**
 * Returns a map of agnostic props and their translation depending on vertical or horizontal orientation.
 * @param vertical scrolldirection (true = vertical)
 */
export const agnosticProps = <T extends boolean>(vertical: T): T extends true ? Vertical : Horizontal =>
	(vertical ? propsV : propsH) as any;

type MatchKeys<K, T> = T extends K ? number : undefined;
type GetType<V extends boolean, T extends Record<string, unknown>> = {
	[X in AgnosticProps]: MatchKeys<keyof T, V extends true ? Vertical[X] : Horizontal[X]>;
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
): GetType<V, T> => processValues(agnosticProps(vertical), value => obj[(value as unknown) as keyof T]);
