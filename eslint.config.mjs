//@ts-check

import eslint from '@eslint/js';
import compat from 'eslint-plugin-compat';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
	{ ignores: ['dist/'] },
	eslint.configs.recommended,
	tseslint.configs.recommendedTypeChecked,
	compat.configs['flat/recommended'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: ['vitest.config.ts'],
				},
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			'no-useless-rename': 'warn',
			'@typescript-eslint/no-explicit-any': 'off',
		},
	},
	{
		files: ['**/*.mjs'],
		...tseslint.configs.disableTypeChecked,
	}
);
