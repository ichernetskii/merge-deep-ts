import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import love from "eslint-config-love";
import stylistic from "@stylistic/eslint-plugin";
import tseslint from "typescript-eslint";

export default defineConfig(
	globalIgnores(["dist/", "coverage/", "reports/", ".yarn/", ".pnp.*"]),
	{
		files: ["**/*.{js,mjs,cjs}"],
		extends: [js.configs.recommended],
		languageOptions: { globals: globals.node },
	},
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
			"@typescript-eslint/no-unused-vars": ["error", { args: "all", argsIgnorePattern: "^_", caughtErrors: "all" }],
			"@typescript-eslint/switch-exhaustiveness-check": "warn",
			"@typescript-eslint/strict-boolean-expressions": "off",
			"@typescript-eslint/no-empty-function": "off",
			"@typescript-eslint/no-confusing-void-expression": "off",
			"@typescript-eslint/consistent-type-definitions": "off",
			// the merge helpers fill the `target` objects they create
			"no-param-reassign": ["error", { props: true, ignorePropertyModificationsFor: ["target"] }],
			// the build targets ES2016: the `v` flag requires ES2024, `Object.hasOwn` requires ES2022
			"require-unicode-regexp": ["error", { requireFlag: "u" }],
			"prefer-object-has-own": "off",
			// not part of the previous rule set (eslint-config-standard-with-typescript)
			"@typescript-eslint/no-magic-numbers": "off",
			"@typescript-eslint/prefer-destructuring": "off",
			"no-plusplus": "off",
		},
	},
	{
		files: ["src/test/**"],
		rules: {
			"max-lines": "off",
			"max-nested-callbacks": "off",
			"@typescript-eslint/class-methods-use-this": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unsafe-type-assertion": "off",
			"@typescript-eslint/explicit-function-return-type": "off",
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
			"@stylistic/space-before-function-paren": ["error", { anonymous: "never", named: "never", asyncArrow: "never", catch: "always" }],
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
