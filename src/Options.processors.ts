import {
	PixelConverter,
	Private,
	PrivateUninferred,
	Public,
	inferredTriggers,
	defaults as optionDefaults,
} from './Options';
import { makeError, warn } from './ScrollMagicError';
import { getScrollContainerDimensions } from './util/getScrollContainerDimensions';
import { agonosticValues } from './util/agnosticValues';
import { PropertyProcessors, processProperties } from './util/processProperties';
import { sanitizeProperties } from './util/sanitizeProperties';
import {
	nullPassThrough,
	toBoolean,
	toNonNullable,
	toPixelConverter,
	toSvgOrHtmlElement,
	toValidScrollParent,
} from './util/transformers';
import { isHTMLElement, isNull, isSVGElement, isWindow } from './util/typeguards';

const transformers: PropertyProcessors<Required<Public>, PrivateUninferred> = {
	element: nullPassThrough(toSvgOrHtmlElement),
	scrollParent: toValidScrollParent,
	vertical: toBoolean,
	triggerStart: nullPassThrough(toPixelConverter),
	triggerEnd: nullPassThrough(toPixelConverter),
	elementStart: toPixelConverter,
	elementEnd: toPixelConverter,
};

// removes unknown properties from supplied options
export const sanitize = <T extends Public>(options: T): T => sanitizeProperties(options, optionDefaults);

// converts all public values to their corresponding private value, leaving null values untoched
const transform = (options: Public): Partial<PrivateUninferred> => processProperties(options, transformers);

// processes remaining null values
const infer = (options: PrivateUninferred): Private => {
	const { scrollParent, element } = options;

	const inferElement = (elem: Element | null) =>
		toNonNullable(elem, () => {
			const elem = isWindow(scrollParent) ? document.body : scrollParent.firstElementChild;
			if (isNull(elem) || !(isHTMLElement(elem) || isSVGElement(elem))) {
				throw makeError(`Could not autodetect element, as scrollParent has no valid children.`);
			}
			return elem;
		});

	const inferTrigger = (val: PixelConverter | null) =>
		toNonNullable(val, () => (isNull(element) ? inferredTriggers.fallback : inferredTriggers.default));

	return processProperties(options, {
		element: inferElement,
		triggerStart: inferTrigger,
		triggerEnd: inferTrigger,
	});
};

// checks if the options the user entered actually make sense
const check = (options: Private): void => {
	const { triggerStart, triggerEnd, elementStart, elementEnd, vertical, scrollParent } = options;
	const { size: elementSize } = getElementSize(options);
	const { clientSize: containerSize } = agonosticValues(vertical, getScrollContainerDimensions(scrollParent));

	const elementDistance = elementSize - elementStart(elementSize) - elementEnd(elementSize);
	const trackDistance = -(containerSize - triggerStart(containerSize) - triggerEnd(containerSize));

	const total = elementDistance + trackDistance;
	if (total < 0) {
		warn(
			'Detected no overlap with the configured track options. This means ScrollMagic will not trigger unless this changes later on (i.e. due to resizes).',
			{
				...options,
				triggerStart: triggerStart(elementSize),
				triggerEnd: triggerEnd(elementSize),
				elementStart: elementStart(elementSize),
				elementEnd: elementEnd(elementSize),
			}
		);
	}
};

export const process = <T extends Public>(newOptions: T, oldOptions: Private): { sanitized: T; processed: Private } => {
	const sanitized = sanitize(newOptions);
	const normalized = transform(sanitized);
	const processed = infer({ ...oldOptions, ...normalized });
	check(processed); // finally sanity check
	return { sanitized, processed };
};

// helpers
const getElementSize = ({ vertical, element }: Pick<Private, 'vertical' | 'element'>) =>
	agonosticValues(vertical, element.getBoundingClientRect());
