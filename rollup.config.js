import pkg from './package.json';

import path from 'path';
import typescript from 'rollup-plugin-typescript2';
import license from 'rollup-plugin-license';
import { terser } from 'rollup-plugin-terser';

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

export default {
	input: inputFile,
	output: [umdOutput, esmOutput],
	plugins: [typescript(tsPluginConfig), license(licenseConfig), terser()],
};
