// Smoke test of the built package: `import` must resolve to the ESM build through the "exports" map
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import merge from "merge-deep-ts";
import test from "node:test";

const require = createRequire(import.meta.url);

test("import resolves to the ESM build", () => {
	assert.equal(import.meta.resolve("merge-deep-ts"), new URL("../../dist/mjs/index.js", import.meta.url).href);
});

test("the default export merges objects deeply", () => {
	assert.equal(typeof merge, "function");
	assert.deepEqual(
		merge([{ a: 1, o: { x: 1 }, arr: [1, 2] }, { b: 2, o: { y: 2 }, arr: [3] }]),
		{ a: 1, b: 2, o: { x: 1, y: 2 }, arr: [3, 2] },
	);
	assert.deepEqual(merge([new Map([["a", { x: 1 }]]), new Map([["a", { y: 2 }]])]), new Map([["a", { x: 1, y: 2 }]]));
	assert.deepEqual(merge([new Set([1]), new Set([2])]), new Set([1, 2]));
	assert.equal(merge([]), null);
	assert.throws(() => merge({}), { message: "Argument must be an array" });
});

test("circular references are merged", () => {
	const obj1 = { a: 1 };
	const obj2 = { b: 2 };
	obj1.self = obj1;
	obj2.self = obj2;
	const actual = merge([obj1, obj2]);
	assert.equal(actual.self, actual);
	assert.equal(actual.a, 1);
	assert.equal(actual.b, 2);
});

test("the ESM and CJS builds produce the same results", () => {
	const cjsMerge = require("merge-deep-ts").default;
	assert.notEqual(cjsMerge, merge);
	const args = [{ a: [1, { x: 1 }], s: new Set([1]) }, { a: [undefined, { y: 2 }], s: new Set([2]) }];
	assert.deepEqual(cjsMerge(args), merge(args));
});

test("the build doesn't contain tests", () => {
	assert.equal(existsSync(new URL("../../dist/mjs/test", import.meta.url)), false);
	assert.equal(existsSync(new URL("../../dist/cjs/test", import.meta.url)), false);
});
