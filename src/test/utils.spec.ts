import { isArray, isMap, isNullable, isObject, isSet, setProperty } from "../utils.js";

describe("type guards", () => {
	class Foo {
		a = 1;
	}
	const values = {
		object: { a: 1 },
		nullPrototypeObject: Object.create(null) as object,
		classInstance: new Foo(),
		array: [1, 2],
		map: new Map([["a", 1]]),
		set: new Set([1, 2]),
		null: null,
		undefined,
		number: 1,
		string: "a",
		boolean: true,
		symbol: Symbol("a"),
		bigint: BigInt(1),
		function: () => {},
		regexp: /.*/u,
		date: new Date(),
		typedArray: new Float64Array(),
		promise: Promise.resolve(),
		error: new Error("error"),
		weakMap: new WeakMap(),
		mapSubclass: new (class extends Map {})(),
		toStringTag: { [Symbol.toStringTag]: "Tag" },
	};
	const accepted = (guard: (value: unknown) => boolean): string[] =>
		Object.entries(values).filter(([, value]) => guard(value)).map(([key]) => key);

	it("isObject should accept objects with the [object Object] tag only", () => {
		expect(accepted(isObject)).toEqual(["object", "nullPrototypeObject", "classInstance"]);
	});

	it("isArray should accept arrays only", () => {
		expect(accepted(isArray)).toEqual(["array"]);
	});

	it("isMap should accept Map instances only", () => {
		expect(accepted(isMap)).toEqual(["map"]);
	});

	it("isSet should accept Set instances only", () => {
		expect(accepted(isSet)).toEqual(["set"]);
	});

	it("isNullable should accept null and undefined only", () => {
		expect(accepted(isNullable)).toEqual(["null", "undefined"]);
	});
});

describe("setProperty", () => {
	it("should set an own enumerable property", () => {
		const symbol = Symbol("symbol");
		const target: Record<PropertyKey, unknown> = {};
		setProperty(target, "a", 1);
		setProperty(target, symbol, 2);
		expect(target).toEqual({ a: 1, [symbol]: 2 });
	});

	it("should define __proto__ as an own property", () => {
		const target: Record<PropertyKey, unknown> = {};
		const value = { polluted: true };
		setProperty(target, "__proto__", value);
		expect(Object.getPrototypeOf(target)).toBe(Object.prototype);
		expect(Object.getOwnPropertyDescriptor(target, "__proto__")).toEqual({
			value,
			writable: true,
			enumerable: true,
			configurable: true,
		});
	});
});
