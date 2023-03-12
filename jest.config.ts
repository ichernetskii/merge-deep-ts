import type { Config } from "jest";

const config: Config = {
	collectCoverage: true,
	coverageReporters: ["text"],
	testEnvironment: "node",
	maxWorkers: 1,
	moduleNameMapper: {
		"@/(.*)": "<rootDir>/src/$1",
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
