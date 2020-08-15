import pkg from './package.json';

import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';

const devMode = process.env.ROLLUP_WATCH;

const umdOutput = {
	format: 'umd',
	file: pkg.main,
	name: pkg.title, // var name of browser global
};

const esmOutput = {
	format: 'esm',
	file: pkg.module,
	sourcemap: true,
};

export default {
	input: 'src/scrollmagic.ts',
	output: [umdOutput, esmOutput],
	plugins: [typescript(), !devMode && terser()],
};
