import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import bundleSize from 'rollup-plugin-bundle-size';
import clean from 'rollup-plugin-delete';
import license from 'rollup-plugin-license';

import pkg from './package.json' with { type: 'json' };
import cfg from './tsconfig.json' with { type: 'json' };

export default {
	input: './src/index.ts',
	output: [
		{
			format: 'umd',
			file: pkg.main,
			name: pkg.title,
			sourcemap: true,
		},
		{
			format: 'esm',
			file: pkg.module,
			sourcemap: true,
		},
	],
	plugins: [
		clean({
			targets: `${cfg.compilerOptions.outDir}/*`,
		}),
		bundleSize(),
		typescript({
			declarationDir: './dist/types',
		}),
		terser(),
		license({
			banner: {
				commentStyle: 'ignored',
				content: {
					file: './config/banner.txt',
					encoding: 'utf-8',
				},
			},
		}),
	],
};
