import { defineConfig, globalIgnores } from "eslint/config";
import love from "eslint-config-love";
import stylistic from "@stylistic/eslint-plugin";
import tseslint from "typescript-eslint";

export default defineConfig(
	globalIgnores(["dist/", "coverage/", "reports/", ".yarn/", ".pnp.*"]),
	{
		files: ["**/*.ts"],
		extends: [tseslint.configs.recommended, love],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			"no-return-assign": "off",
			"@typescript-eslint/no-unused-vars": ["error", { args: "all", caughtErrors: "all" }],
			"@typescript-eslint/switch-exhaustiveness-check": "warn",
			"@typescript-eslint/strict-boolean-expressions": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-empty-function": "off",
			"@typescript-eslint/no-confusing-void-expression": "off",
			"@typescript-eslint/consistent-type-definitions": "off",
			"@typescript-eslint/require-array-sort-compare": "off",
			// the `v` flag requires ES2024, the build targets ES2016
			"require-unicode-regexp": ["error", { requireFlag: "u" }],
			// not part of the previous rule set (eslint-config-standard-with-typescript)
			"@typescript-eslint/no-magic-numbers": "off",
			"@typescript-eslint/prefer-destructuring": "off",
			"no-plusplus": "off",
			"no-param-reassign": "off",
			"complexity": "off",
			"@typescript-eslint/no-unsafe-argument": "off",
			"@typescript-eslint/no-unsafe-assignment": "off",
			"@typescript-eslint/no-unsafe-call": "off",
			"@typescript-eslint/no-unsafe-member-access": "off",
			"@typescript-eslint/no-unsafe-return": "off",
			"@typescript-eslint/no-unsafe-type-assertion": "off",
			"@typescript-eslint/no-unnecessary-type-parameters": "off",
		},
	},
	{
		files: ["src/test/**"],
		rules: {
			"max-lines": "off",
			"max-nested-callbacks": "off",
			"@typescript-eslint/class-methods-use-this": "off",
		},
	},
	{
		plugins: { "@stylistic": stylistic },
		rules: {
			"sort-imports": "error",
			"@stylistic/quotes": ["error", "double"],
			"@stylistic/indent": ["error", "tab", { SwitchCase: 1 }],
			"@stylistic/no-tabs": ["error", { allowIndentationTabs: true }],
			"@stylistic/semi": ["error", "always"],
			"@stylistic/comma-dangle": ["error", "always-multiline"],
			"@stylistic/space-before-function-paren": ["error", "never"],
			"@stylistic/member-delimiter-style": [
				"error",
				{
					multiline: { delimiter: "semi", requireLast: true },
					singleline: { delimiter: "semi", requireLast: true },
				},
			],
		},
	},
);
