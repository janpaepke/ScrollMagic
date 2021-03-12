import path from 'path';

import license from 'rollup-plugin-license';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';

import pkg from './package.json';

const inputFile = './src/scrollmagic/index.ts';
const bannerFile = './src/config/banner.txt';

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
			declarationDir: path.join(__dirname, path.dirname(pkg.types)),
		},
	},
};

const licenseConfig = {
	banner: {
		commentStyle: 'ignored',
		content: {
			file: path.join(__dirname, bannerFile),
			encoding: 'utf-8',
		},
	},
};

const minificationConfig = {
	compress: {
		unsafe: true,
	},
	format: {
		comments: false,
	},
};

export default {
	input: inputFile,
	output: [umdOutput, esmOutput],
	plugins: [typescript(tsPluginConfig), terser(minificationConfig), license(licenseConfig)],
};
