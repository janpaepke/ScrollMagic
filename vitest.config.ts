import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

// `vitest` (watch mode) → show browser; `vitest run` (single-run) → headless
declare const process: { argv: string[] };
const isSingleRun = process.argv.includes('run');

export default defineConfig({
	test: {
		projects: [
			{
				test: {
					name: 'unit',
					include: [`tests/unit/**/*.test.ts`],
					environment: 'jsdom',
				},
			},
			{
				test: {
					name: 'e2e',
					include: [`tests/e2e/**/*.test.ts`],
					browser: {
						enabled: true,
						headless: isSingleRun,
						provider: playwright(),
						instances: [{ browser: 'chromium' }],
					},
				},
			},
		],
	},
});
