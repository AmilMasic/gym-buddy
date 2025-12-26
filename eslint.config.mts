import tseslint from 'typescript-eslint';
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import { globalIgnores } from "eslint/config";

export default tseslint.config(
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: [
						'eslint.config.js',
						'eslint.config.mts',
						'manifest.json'
					]
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: ['.json']
			},
		},
	},
	// TypeScript recommended rules
	...tseslint.configs.recommended,
	...obsidianmd.configs.recommended,
	// Stricter rules to match Obsidian plugin submission requirements
	{
		files: ["**/*.ts", "**/*.mts"],
		rules: {
			// Prevent disabling rules that Obsidian submission blocks
			"@typescript-eslint/no-explicit-any": "error",
			"@typescript-eslint/require-await": "error",
		},
	},
	globalIgnores([
		"node_modules",
		"dist",
		"esbuild.config.mjs",
		"eslint.config.js",
		"version-bump.mjs",
		"versions.json",
		"main.js",
		"vitest.config.ts",
		"__mocks__",
	]),
);
