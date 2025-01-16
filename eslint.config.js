import { default as defaultConfig } from '@epic-web/config/eslint'

/** @type {import("eslint").Linter.Config} */
const options = [
	...defaultConfig,
	// add custom config objects here:
	{
		ignores: ['**/.react-router/**'],
	},
	{
		files: ['**/tests/**/*.ts'],
		rules: { 'react-hooks/rules-of-hooks': 'off' },
	},
]

export default options
