import {
	PixelConverter,
	Private,
	PrivateUninferred,
	Public,
	inferredContainerDefaults,
	defaults as optionDefaults,
} from './Options';
import { ScrollMagicError } from './ScrollMagicError';
import { agnosticValues } from './util/agnosticValues';
import { getScrollContainerDimensions } from './util/getScrollContainerDimensions';
import { PropertyProcessors, processProperties } from './util/processProperties';
import { sanitizeProperties } from './util/sanitizeProperties';
import { skipNull, toPixelConverter, toSvgOrHtmlElement, toValidContainer } from './util/transformers';
import { isHTMLElement, isSVGElement, isWindow } from './util/typeguards';

const transformers: PropertyProcessors<Required<Public>, PrivateUninferred> = {
	element: skipNull(toSvgOrHtmlElement),
	elementStart: toPixelConverter,
	elementEnd: toPixelConverter,
	container: skipNull(toValidContainer),
	containerStart: skipNull(toPixelConverter),
	containerEnd: skipNull(toPixelConverter),
	vertical: Boolean,
};

// removes unknown properties from supplied options
export const sanitizeOptions = <T extends Public>(options: T): T => sanitizeProperties(options, optionDefaults);

// converts all public values to their corresponding private value, leaving null values untouched
const transform = (options: Public): Partial<PrivateUninferred> => processProperties(options, transformers);

// processes remaining null values
const infer = (options: PrivateUninferred): Private => {
	const inferContainer = (container: Window | HTMLElement | null): Window | HTMLElement => container ?? window;

	const inferElement = (elem: Element | null): HTMLElement | SVGElement => {
		if (null !== elem) {
			return elem as HTMLElement | SVGElement;
		}
		const resolved = inferContainer(options.container);
		const child = isWindow(resolved) ? document.body : resolved.firstElementChild;
		if (null === child || !(isHTMLElement(child) || isSVGElement(child))) {
			throw new ScrollMagicError(`Could not autodetect element, as container has no valid children.`);
		}
		return child;
	};

	const inferContainerOffset = (val: PixelConverter | null): PixelConverter =>
		val ?? (null === options.element ? inferredContainerDefaults.fallback : inferredContainerDefaults.default);

	return processProperties(options, {
		container: inferContainer,
		element: inferElement,
		containerStart: inferContainerOffset,
		containerEnd: inferContainerOffset,
	});
};

// checks if the options the user entered actually make sense
const sanityCheck = (options: Private): void => {
	const { containerStart, containerEnd, elementStart, elementEnd, vertical, container, element } = options;

	if (!isWindow(container) && !container.contains(element)) {
		console?.error(
			'ScrollMagic: element is not a descendant of container. The IntersectionObserver requires an ancestor relationship to function correctly.',
			{ element, container }
		);
	}

	const { size: elementSize } = getElementSize(options);
	const { clientSize: containerSize } = agnosticValues(vertical, getScrollContainerDimensions(container));

	const elementDistance = elementSize - elementStart(elementSize) - elementEnd(elementSize);
	const trackDistance = -(containerSize - containerStart(containerSize) - containerEnd(containerSize));

	const total = elementDistance + trackDistance;
	if (total < 0) {
		console?.warn(
			'ScrollMagic Warning: Detected no overlap with the configured track options. This means ScrollMagic will not trigger unless this changes later on (i.e. due to resizes).',
			{
				...options,
				containerStart: containerStart(containerSize),
				containerEnd: containerEnd(containerSize),
				elementStart: elementStart(elementSize),
				elementEnd: elementEnd(elementSize),
			}
		);
	}
};

export const processOptions = <T extends Public>(
	newOptions: T,
	oldOptions?: Private
): { sanitized: T; processed: Private } => {
	const sanitized = sanitizeOptions(newOptions);
	const normalized = transform(sanitized);
	const processed = infer({ ...oldOptions, ...normalized } as PrivateUninferred);
	if (typeof process === 'undefined' || process.env.NODE_ENV !== 'production') {
		sanityCheck(processed);
	}
	return { sanitized, processed };
};

// helpers
const getElementSize = ({ vertical, element }: Pick<Private, 'vertical' | 'element'>) =>
	agnosticValues(vertical, element.getBoundingClientRect());
