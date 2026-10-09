// Smoke test of the built package: `require` must resolve to the CJS build through the "exports" map
const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

test("require resolves to the CJS build", () => {
	assert.equal(require.resolve("merge-deep-ts"), path.resolve(__dirname, "../../dist/cjs/index.js"));
});

test("the module has a default export", () => {
	const module = require("merge-deep-ts");
	assert.equal(module.__esModule, true);
	assert.deepEqual(Object.keys(module), ["default"]);
	assert.equal(typeof module.default, "function");
});

test("the default export merges objects deeply", () => {
	const merge = require("merge-deep-ts").default;
	assert.deepEqual(
		merge([{ a: 1, o: { x: 1 }, arr: [1, 2] }, { b: 2, o: { y: 2 }, arr: [3] }]),
		{ a: 1, b: 2, o: { x: 1, y: 2 }, arr: [3, 2] },
	);
	assert.equal(merge([]), null);
	assert.throws(() => merge({}), { message: "Argument must be an array" });
});

test("package.json is exported", () => {
	assert.equal(require("merge-deep-ts/package.json").name, "merge-deep-ts");
});
