import json from '@rollup/plugin-json';
import clean from 'rollup-plugin-delete';
import filesize from 'rollup-plugin-filesize';
import license from 'rollup-plugin-license';
import { terser } from 'rollup-plugin-terser';
import ts from 'rollup-plugin-ts';

import pkg from './package.json';
import cfg from './tsconfig.json';

export default [
	{
		input: './src/index.ts',
		output: [
			{
				format: 'umd',
				file: pkg.main,
				name: pkg.title, // var name of browser global
			},
			{
				format: 'esm',
				file: pkg.module,
			},
		],
		plugins: [
			clean({
				targets: `${cfg.compilerOptions.outDir}/*`,
			}),
			filesize({
				showMinifiedSize: false,
			}),
			json(),
			ts({
				hook: {
					outputPath: (path, kind) => (kind === 'declaration' ? pkg.types : path), // only one single type declaration file, instead of one per output file
				},
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
	},
];
