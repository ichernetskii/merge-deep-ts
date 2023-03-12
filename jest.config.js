export default {
	testEnvironment: "node",
	moduleNameMapper: {
		"@/(.*)": "<rootDir>/src/$1",
	},
	testRegex: ".+(spec|test).[jt]s$",
	transform: {
		".+.ts$": [
			"ts-jest",
			{ tsconfig: "./tsconfig.json" },
		],
	},
};
