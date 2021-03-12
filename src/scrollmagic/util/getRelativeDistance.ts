/**
 * returns a px value for a Unit Tuple either directly or in relation to a reference distance
 */
export const getPixelDistance = (distance: [value: number, unit: string], referenceDistance: number): number => {
	const [distanceValue, distanceUnit] = distance;
	if (distanceValue === 0) {
		// yay, super easy
		return 0;
	}
	// how many px offset are we talking?
	return distanceUnit === 'px' ? distanceValue : distanceValue * referenceDistance;
};
