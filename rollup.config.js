import pkg from './package.json';

import path from 'path';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';

const inputFile = 'src/scrollmagic.ts';
const devMode = process.env.ROLLUP_WATCH;

const umdOutput = {
	format: 'umd',
	file: pkg.main,
	name: pkg.title, // var name of browser global
	sourcemap: true,
};

const esmOutput = {
	format: 'esm',
	file: pkg.module,
	sourcemap: true,
};

const tsPluginConfig = {
	useTsconfigDeclarationDir: true,
	tsconfigOverride: {
		compilerOptions: {
			declaration: true,
			declarationMap: true,
			declarationDir: path.dirname(pkg.types),
		},
	},
};

export default {
	input: inputFile,
	output: [umdOutput, esmOutput],
	plugins: [typescript(tsPluginConfig), !devMode && terser()],
};
