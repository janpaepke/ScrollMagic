import {
	PixelConverter,
	Private,
	PrivateUninferred,
	Public,
	inferredTriggers,
	defaults as optionDefaults,
} from './Options';
import { ScrollMagicError, warn } from './ScrollMagicError';
import { agnosticValues } from './util/agnosticValues';
import { getScrollContainerDimensions } from './util/getScrollContainerDimensions';
import { PropertyProcessors, processProperties } from './util/processProperties';
import { sanitizeProperties } from './util/sanitizeProperties';
import {
	skipNull,
	toPixelConverter,
	toSvgOrHtmlElement,
	toValidScrollParent,
} from './util/transformers';
import { isHTMLElement, isSVGElement, isWindow } from './util/typeguards';

const transformers: PropertyProcessors<Required<Public>, PrivateUninferred> = {
	element: skipNull(toSvgOrHtmlElement),
	scrollParent: skipNull(toValidScrollParent),
	vertical: Boolean,
	triggerStart: skipNull(toPixelConverter),
	triggerEnd: skipNull(toPixelConverter),
	elementStart: toPixelConverter,
	elementEnd: toPixelConverter,
};

// removes unknown properties from supplied options
export const sanitize = <T extends Public>(options: T): T => sanitizeProperties(options, optionDefaults);

// converts all public values to their corresponding private value, leaving null values untouched
const transform = (options: Public): Partial<PrivateUninferred> => processProperties(options, transformers);

// processes remaining null values
const infer = (options: PrivateUninferred): Private => {
	const inferScrollParent = (container: Window | HTMLElement | null): Window | HTMLElement => container ?? window;

	const inferElement = (elem: Element | null): HTMLElement | SVGElement => {
		if (null !== elem) {
			return elem as HTMLElement | SVGElement;
		}
		const container = inferScrollParent(options.scrollParent);
		const child = isWindow(container) ? document.body : container.firstElementChild;
		if (null === child || !(isHTMLElement(child) || isSVGElement(child))) {
			throw new ScrollMagicError(`Could not autodetect element, as scrollParent has no valid children.`);
		}
		return child;
	};

	const inferTrigger = (val: PixelConverter | null): PixelConverter =>
		val ?? (null === options.element ? inferredTriggers.fallback : inferredTriggers.default);

	return processProperties(options, {
		scrollParent: inferScrollParent,
		element: inferElement,
		triggerStart: inferTrigger,
		triggerEnd: inferTrigger,
	});
};

// checks if the options the user entered actually make sense
const check = (options: Private): void => {
	const { triggerStart, triggerEnd, elementStart, elementEnd, vertical, scrollParent } = options;
	const { size: elementSize } = getElementSize(options);
	const { clientSize: containerSize } = agnosticValues(vertical, getScrollContainerDimensions(scrollParent));

	const elementDistance = elementSize - elementStart(elementSize) - elementEnd(elementSize);
	const trackDistance = -(containerSize - triggerStart(containerSize) - triggerEnd(containerSize));

	const total = elementDistance + trackDistance;
	if (total < 0) {
		warn(
			'Detected no overlap with the configured track options. This means ScrollMagic will not trigger unless this changes later on (i.e. due to resizes).',
			{
				...options,
				triggerStart: triggerStart(containerSize),
				triggerEnd: triggerEnd(containerSize),
				elementStart: elementStart(elementSize),
				elementEnd: elementEnd(elementSize),
			}
		);
	}
};

export const process = <T extends Public>(
	newOptions: T,
	oldOptions?: Private
): { sanitized: T; processed: Private } => {
	const sanitized = sanitize(newOptions);
	const normalized = transform(sanitized);
	const processed = infer({ ...oldOptions, ...normalized } as PrivateUninferred);
	check(processed); // finally sanity check
	return { sanitized, processed };
};

// helpers
const getElementSize = ({ vertical, element }: Pick<Private, 'vertical' | 'element'>) =>
	agnosticValues(vertical, element.getBoundingClientRect());
