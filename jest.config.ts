import type { Config } from "jest";

const config: Config = {
	collectCoverage: true,
	coverageReporters: ["text", "lcov"],
	coverageThreshold: {
		global: { branches: 95, functions: 95, lines: 95, statements: 95 },
	},
	reporters: ["default", ["jest-junit", { outputDirectory: "reports", outputName: "report.xml" }]],
	testEnvironment: "node",
	maxWorkers: 1,
	roots: ["<rootDir>/src"],
	moduleNameMapper: {
		"^(\\.{1,2}/.*)\\.js$": "$1",
	},
	testRegex: ".+(spec|test).[jt]s$",
	transform: {
		".+.ts$": [
			"ts-jest",
			{
				tsconfig: "./tsconfig.jest.json",
			},
		],
	},
};
export default config;
