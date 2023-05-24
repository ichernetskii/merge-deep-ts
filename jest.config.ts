import type { Config } from "jest";

const config: Config = {
	collectCoverage: true,
	coverageReporters: ["text", "lcov"],
	reporters: [["jest-junit", { outputDirectory: "reports", outputName: "report.xml" }]],
	testEnvironment: "node",
	maxWorkers: 1,
	moduleNameMapper: {
		"(.*)\\.js$": "$1",
	},
	testRegex: ".+(spec|test).[jt]s$",
	transform: {
		".+.ts$": [
			"ts-jest",
			{
				tsconfig: "./tsconfig.jest.json",
				useESM: true,
			},
		],
	},
};
export default config;
