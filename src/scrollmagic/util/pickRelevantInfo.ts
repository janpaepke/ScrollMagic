const verticalProps = {
	start: 'top',
	end: 'bottom',
	size: 'height',
	clientSize: 'clientHeight',
	scrollSize: 'scrollHeight',
} as const;
const horizontalProps = {
	start: 'left',
	end: 'right',
	size: 'width',
	clientSize: 'clientWidth',
	scrollSize: 'scrollWidth',
} as const;

type VerticalProps = typeof verticalProps;
type HorizontalProps = typeof horizontalProps;
type Props = keyof VerticalProps & keyof HorizontalProps;
type SourceProps = VerticalProps[Props] | HorizontalProps[Props];
export type RectInfo = Record<SourceProps, number>;

type MatchType<T, P, K extends keyof T & keyof P> = T[K] extends P[K] ? T[K] : undefined;

/**
 * Returns the relevant property names depending on vertical or horizontal orientation.
 * @param vertical scrolldirection (true = vertical)
 */
export const pickRelevantProps = (vertical: boolean): VerticalProps | HorizontalProps =>
	vertical ? verticalProps : horizontalProps;
/**
 * Returns the relevant boundary values depending on vertical or horizontal orientation.
 * I.E. top or left value => start, width / height => size.
 * @param obj Object to tretrieve the values from
 * @param vertical scrolldirection (true = vertical)
 */
export const pickRelevantValues = <T extends Partial<RectInfo>, V extends boolean>(
	vertical: V,
	obj: T
	// the idea with the return type is to make sure each property has the correct type based on the object that is passed in.
	// i.e. if both top and left exist -> number, if only top exists -> number | undefined, if neither exist -> undefined.
): { [X in Props]: MatchType<T, RectInfo, VerticalProps[X]> | MatchType<T, RectInfo, HorizontalProps[X]> } =>
	Object.entries(pickRelevantProps(vertical)).reduce((res, [key, value]) => {
		return {
			...res,
			[key]: obj[value],
		};
	}, {} as { [X in Props]: MatchType<T, RectInfo, VerticalProps[X]> | MatchType<T, RectInfo, HorizontalProps[X]> });
