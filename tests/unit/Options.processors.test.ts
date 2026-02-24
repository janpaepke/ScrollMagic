import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { sanitizeOptions, processOptions } from '../../src/Options.processors';
import { defaults } from '../../src/Options';
import type { Public } from '../../src/Options';

// NOTE: jsdom's window doesn't pass `instanceof Window`, so tests that rely on
// window as container (the default) are limited. Window-container behavior is
// covered by e2e tests. Here we focus on explicit HTMLElement containers.

// Mirrors what the ScrollMagic constructor does: spreads defaults before processing.
const fullOptions = (overrides: Public = {}): Required<Public> => ({
	...defaults,
	...overrides,
});

describe('sanitizeOptions', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('keeps known ScrollMagic options', () => {
		const result = sanitizeOptions({ element: null, vertical: false });
		expect(result).toEqual({ element: null, vertical: false });
	});

	test('strips unknown options', () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const result = sanitizeOptions({ element: null, bogus: 42 } as never);
		expect('bogus' in result).toBe(false);
	});

	test('warns about unknown options', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		sanitizeOptions({ nonsense: true } as never);
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('nonsense'));
	});
});

describe('processOptions', () => {
	let container: HTMLElement;
	let element: HTMLElement;

	beforeEach(() => {
		document.body.innerHTML = '';
		container = document.createElement('div');
		element = document.createElement('div');
		container.appendChild(element);
		document.body.appendChild(container);
	});

	afterEach(() => {
		document.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	test('transforms valid options into processed form', () => {
		const { processed } = processOptions(fullOptions({ element, container, vertical: true }));
		expect(processed.element).toBe(element);
		expect(processed.container).toBe(container);
		expect(processed.vertical).toBe(true);
		expect(typeof processed.elementStart).toBe('function');
		expect(typeof processed.elementEnd).toBe('function');
		expect(typeof processed.containerStart).toBe('function');
		expect(typeof processed.containerEnd).toBe('function');
	});

	test('default elementStart and elementEnd return 0', () => {
		const { processed } = processOptions(fullOptions({ element, container }));
		expect(processed.elementStart(100)).toBe(0);
		expect(processed.elementEnd(100)).toBe(0);
	});

	test('resolves CSS selector for element', () => {
		element.id = 'tracked';
		const { processed } = processOptions(fullOptions({ element: '#tracked', container }));
		expect(processed.element).toBe(element);
	});

	test('resolves CSS selector for container', () => {
		container.id = 'scroll-parent';
		const { processed } = processOptions(fullOptions({ element, container: '#scroll-parent' }));
		expect(processed.container).toBe(container);
	});

	test('null element defaults to first child of container', () => {
		const { processed } = processOptions(fullOptions({ element: null, container }));
		expect(processed.element).toBe(element);
	});

	test('throws when container has no valid children for element inference', () => {
		const empty = document.createElement('div');
		document.body.appendChild(empty);
		expect(() => processOptions(fullOptions({ element: null, container: empty }))).toThrow(
			'Could not autodetect element, as container has no valid children'
		);
	});

	test('containerStart/End default to 100% when element is explicit', () => {
		const { processed } = processOptions(fullOptions({ element, container }));
		expect(processed.containerStart(800)).toBe(800);
		expect(processed.containerEnd(800)).toBe(800);
	});

	test('containerStart/End default to 0 when element is null (first-child fallback)', () => {
		const { processed } = processOptions(fullOptions({ element: null, container }));
		expect(processed.containerStart(800)).toBe(0);
		expect(processed.containerEnd(800)).toBe(0);
	});

	test('explicit containerStart/End values are preserved', () => {
		const { processed } = processOptions(
			fullOptions({
				element,
				container,
				containerStart: '50%',
				containerEnd: 100,
			})
		);
		expect(processed.containerStart(400)).toBe(200);
		expect(processed.containerEnd(400)).toBe(100);
	});

	test('preserves oldOptions for unspecified keys (modify scenario)', () => {
		const { processed: initial } = processOptions(fullOptions({ element, container, vertical: false }));
		// modify: only changing vertical, the rest comes from oldOptions
		const { processed: modified } = processOptions({ vertical: true }, initial);
		expect(modified.element).toBe(element);
		expect(modified.container).toBe(container);
		expect(modified.vertical).toBe(true);
	});

	test('returns sanitized options alongside processed ones', () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const opts = { ...fullOptions({ element, container }), bogus: 1 };
		const { sanitized } = processOptions(opts as unknown as Required<Public>);
		expect('bogus' in sanitized).toBe(false);
		expect(sanitized.element).toBe(element);
	});

	test('vertical defaults to true', () => {
		const { processed } = processOptions(fullOptions({ element, container }));
		expect(processed.vertical).toBe(true);
	});

	test('vertical false is preserved', () => {
		const { processed } = processOptions(fullOptions({ element, container, vertical: false }));
		expect(processed.vertical).toBe(false);
	});

	describe('sanity checks', () => {
		test('warns when element is not a descendant of container', () => {
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			const orphan = document.createElement('div');
			document.body.appendChild(orphan);
			const separate = document.createElement('div');
			document.body.appendChild(separate);

			processOptions(fullOptions({ element: orphan, container: separate }));
			expect(errorSpy).toHaveBeenCalledWith(
				expect.stringContaining('element is not a descendant of container'),
				expect.any(Object)
			);
		});

		test('does not warn when element is inside container', () => {
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			processOptions(fullOptions({ element, container }));
			expect(errorSpy).not.toHaveBeenCalled();
		});

		test('warns when configured offsets produce no overlap', () => {
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			processOptions(
				fullOptions({
					element,
					container,
					elementStart: 99999,
					elementEnd: 99999,
				})
			);
			expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('no overlap'), expect.any(Object));
		});
	});
});
