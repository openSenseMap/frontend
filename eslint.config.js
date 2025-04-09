import { default as defaultConfig } from '@epic-web/config/eslint'
import prettier from 'eslint-plugin-prettier'

/** @type {import("eslint").Linter.Config} */
export default [
	...defaultConfig,
	{
		extends: [defaultConfig],
		files: ['**/tests/**/*.ts'],
		ignores: ['**/.react-router/**'],
		plugins: {
			prettier: prettier,
		},
		rules: {
			'prettier/prettier': 'error',
		},
	},
]
