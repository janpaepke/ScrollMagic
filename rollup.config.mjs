import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import bundleSize from 'rollup-plugin-bundle-size';
import clean from 'rollup-plugin-delete';
import license from 'rollup-plugin-license';

import pkg from './package.json' with { type: 'json' };
import cfg from './tsconfig.json' with { type: 'json' };

const createCommonPlugins = () => [
	bundleSize(),
	typescript({
		declarationDir: './dist/types',
		exclude: ['tests/**/*'],
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
];

const main = {
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
		...createCommonPlugins(),
	],
};

const util = {
	input: './src/util.ts',
	output: [
		{
			format: 'umd',
			file: pkg.exports['./util'].require,
			name: `${pkg.title}Utils`,
			sourcemap: true,
		},
		{
			format: 'esm',
			file: pkg.exports['./util'].import,
			sourcemap: true,
		},
	],
	plugins: createCommonPlugins(),
};

export default [main, util];
