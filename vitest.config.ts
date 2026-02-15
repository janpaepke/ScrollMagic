import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

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
						provider: playwright(),
						instances: [{ browser: 'chromium' }],
					},
				},
			},
		],
	},
});
