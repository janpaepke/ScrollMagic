import { describe, test, expect, afterEach, vi } from 'vitest';
import ScrollMagic from '../../src/index';
import { cleanup } from './helpers';

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

describe('Dev warnings: element / scrollParent relationship', () => {
	test('logs error when element is not a descendant of scrollParent', () => {
		const container = document.createElement('div');
		container.style.height = '400px';
		container.style.overflow = 'auto';
		document.body.appendChild(container);

		const outsideElement = document.createElement('div');
		outsideElement.style.height = '100px';
		document.body.appendChild(outsideElement);

		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.spyOn(console, 'warn').mockImplementation(() => {});

		const scene = new ScrollMagic({ element: outsideElement, scrollParent: container });
		scene.destroy(); // destroy before rAF fires to prevent IntersectionObserver errors from invalid config

		expect(errorSpy).toHaveBeenCalledOnce();
		expect(errorSpy.mock.calls[0][0]).toContain('not a descendant');
	});

	test('does not log error when element is a descendant of scrollParent', () => {
		const container = document.createElement('div');
		container.style.height = '400px';
		container.style.overflow = 'auto';

		const innerElement = document.createElement('div');
		innerElement.style.height = '100px';
		container.appendChild(innerElement);
		document.body.appendChild(container);

		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.spyOn(console, 'warn').mockImplementation(() => {});

		const scene = new ScrollMagic({ element: innerElement, scrollParent: container });
		scene.destroy();

		expect(errorSpy).not.toHaveBeenCalled();
	});

	test('does not log error when scrollParent is window (default)', () => {
		const element = document.createElement('div');
		element.style.height = '100px';
		document.body.appendChild(element);

		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.spyOn(console, 'warn').mockImplementation(() => {});

		const scene = new ScrollMagic({ element });
		scene.destroy();

		expect(errorSpy).not.toHaveBeenCalled();
	});

	test('logs error when scrollParent is updated via modify and element is not a descendant', () => {
		const container = document.createElement('div');
		container.style.height = '400px';
		container.style.overflow = 'auto';
		document.body.appendChild(container);

		const outsideElement = document.createElement('div');
		outsideElement.style.height = '100px';
		document.body.appendChild(outsideElement);

		vi.spyOn(console, 'warn').mockImplementation(() => {});

		const scene = new ScrollMagic({ element: outsideElement }); // window — ok

		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		scene.modify({ scrollParent: container }); // now non-descendant
		scene.destroy();

		expect(errorSpy).toHaveBeenCalledOnce();
		expect(errorSpy.mock.calls[0][0]).toContain('not a descendant');
	});
});
