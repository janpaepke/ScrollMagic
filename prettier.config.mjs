/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
	semi: true,
	useTabs: true,
	printWidth: 120,
	bracketSpacing: true,
	arrowParens: 'avoid',
	htmlWhitespaceSensitivity: 'css',
	endOfLine: 'lf',
	singleQuote: true,
	trailingComma: 'es5',
	experimentalTernaries: true,
};

export default config;
