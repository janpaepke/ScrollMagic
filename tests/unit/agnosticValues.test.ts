import { describe, test, expect } from 'vitest';
import { agnosticProps, agnosticValues } from '../../src/util/agnosticValues';

describe('agnosticProps', () => {
	test('returns vertical props when vertical=true', () => {
		const props = agnosticProps(true);
		expect(props.start).toBe('top');
		expect(props.end).toBe('bottom');
		expect(props.size).toBe('height');
		expect(props.clientSize).toBe('clientHeight');
		expect(props.scrollSize).toBe('scrollHeight');
		expect(props.scrollDelta).toBe('deltaY');
	});

	test('returns horizontal props when vertical=false', () => {
		const props = agnosticProps(false);
		expect(props.start).toBe('left');
		expect(props.end).toBe('right');
		expect(props.size).toBe('width');
		expect(props.clientSize).toBe('clientWidth');
		expect(props.scrollSize).toBe('scrollWidth');
		expect(props.scrollDelta).toBe('deltaX');
	});
});

describe('agnosticValues', () => {
	const rect = { top: 10, left: 20, bottom: 30, right: 40, height: 100, width: 200 };

	test('extracts vertical values', () => {
		const vals = agnosticValues(true, rect);
		expect(vals.start).toBe(10); // top
		expect(vals.end).toBe(30); // bottom
		expect(vals.size).toBe(100); // height
	});

	test('extracts horizontal values', () => {
		const vals = agnosticValues(false, rect);
		expect(vals.start).toBe(20); // left
		expect(vals.end).toBe(40); // right
		expect(vals.size).toBe(200); // width
	});

	test('handles scroll container dimensions', () => {
		const dims = { clientHeight: 500, clientWidth: 300, scrollHeight: 2000, scrollWidth: 600 };
		const vVals = agnosticValues(true, dims);
		expect(vVals.clientSize).toBe(500);
		expect(vVals.scrollSize).toBe(2000);

		const hVals = agnosticValues(false, dims);
		expect(hVals.clientSize).toBe(300);
		expect(hVals.scrollSize).toBe(600);
	});
});
