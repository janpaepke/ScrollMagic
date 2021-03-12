interface RectInfo {
	width: number;
	height: number;
	top: number;
	right: number;
	bottom: number;
	left: number;
}
interface RelevantProps {
	start: 'top' | 'left';
	end: 'bottom' | 'right';
	size: 'height' | 'width';
}
type MatchType<T, P, K extends keyof T & keyof P> = T[K] extends P[K] ? T[K] : undefined;
/**
 * Returns the relevant property names depending on vertical or horizontal orientation.
 * @param vertical scrolldirection (true = vertical)
 */
export const pickRelevantProps = (vertical: boolean): RelevantProps => ({
	start: vertical ? 'top' : 'left',
	end: vertical ? 'bottom' : 'right',
	size: vertical ? 'height' : 'width',
});
/**
 * Returns the relevant boundary values depending on vertical or horizontal orientation.
 * I.E. top or left value => start, width / height => size.
 * @param obj Object to tretrieve the values from
 * @param vertical scrolldirection (true = vertical)
 */
export const pickRelevantValues = <T extends Partial<RectInfo>>(obj: T, vertical: boolean) => {
	const props = pickRelevantProps(vertical);
	// all of the type assertions are there to make sure the property has the correct type based on the object that is passed.
	// i.e. if both top and left exist -> number, if only top exists -> number | undefined, if neither exist -> undefined.
	return {
		start: obj[props.start] as MatchType<T, RectInfo, 'top'> | MatchType<T, RectInfo, 'left'>,
		end: obj[props.end] as MatchType<T, RectInfo, 'bottom'> | MatchType<T, RectInfo, 'right'>,
		size: obj[props.size] as MatchType<T, RectInfo, 'height'> | MatchType<T, RectInfo, 'width'>,
	};
};
