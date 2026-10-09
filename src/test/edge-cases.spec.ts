import { ERROR_NOT_ARRAY } from "../utils.js";
import merge from "../index.js";

const deepFreeze = <T>(value: T, seen = new Set<unknown>()): T => {
	if (typeof value === "object" && value !== null && !seen.has(value)) {
		seen.add(value);
		for (const key of Reflect.ownKeys(value)) {
			deepFreeze((value as Record<PropertyKey, unknown>)[key], seen);
		}
		Object.freeze(value);
	}
	return value;
};

describe("edge cases", () => {
	describe("arguments", () => {
		it("should return null for an empty array", () => {
			expect(merge([])).toBeNull();
		});

		it.each([[{}], [{ a: 1 }], [42], ["str"], [null], [undefined], [new Set([1])]])("should throw if the argument isn't an array: %p", arg => {
			expect(() => merge(arg as never)).toThrow(new Error(ERROR_NOT_ARRAY));
		});

		it("should return a single argument as is", () => {
			const obj = { a: { b: 1 } };
			const arr = [1, 2];
			expect(merge([obj])).toBe(obj);
			expect(merge([arr])).toBe(arr);
			expect(merge([null, obj, undefined])).toBe(obj);
		});

		it("should return the last primitive", () => {
			const symbol = Symbol("symbol");
			expect(merge([1, 2])).toBe(2);
			expect(merge(["a", "b"])).toBe("b");
			expect(merge([true, false])).toBe(false);
			expect(merge([BigInt(1), BigInt(2)])).toBe(BigInt(2));
			expect(merge([1, symbol])).toBe(symbol);
			expect(merge([{ a: 1 }, 0])).toBe(0);
			expect(merge([{ a: 1 }, ""])).toBe("");
			expect(merge([[1], false])).toBe(false);
		});

		it("should copy the last mergeable value that follows a non-mergeable one", () => {
			const obj = { a: { b: 1 } };
			const actual = merge([1, obj]);
			expect(actual).toEqual(obj);
			expect(actual).not.toBe(obj);
			expect(actual.a).toBe(obj.a);
		});

		it("should merge arguments of unknown length", () => {
			const args: Array<{ a: number; b?: number; }> = [{ a: 1, b: 2 }, { a: 3 }, { a: 4 }];
			expect(merge(args)).toEqual({ a: 4, b: 2 });
		});

		it("should merge readonly arguments", () => {
			const args = [{ a: 1 }, { b: [1, 2] }] as const;
			expect(merge(args)).toEqual({ a: 1, b: [1, 2] });
		});

		it("should merge many arguments", () => {
			const args = Array.from({ length: 1000 }, (_, i) => ({ [`key${i % 10}`]: i, last: i }));
			const actual = merge(args);
			expect(actual).toEqual({
				key0: 990, key1: 991, key2: 992, key3: 993, key4: 994, key5: 995, key6: 996, key7: 997, key8: 998, key9: 999, last: 999,
			});
		});
	});

	describe("null and undefined", () => {
		it("shouldn't override values with null and undefined", () => {
			expect(merge([{ a: { x: 1 } }, { a: null }])).toEqual({ a: { x: 1 } });
			expect(merge([{ a: { x: 1 } }, { a: undefined }])).toEqual({ a: { x: 1 } });
			expect(merge([{ a: null }, { a: { x: 1 } }])).toEqual({ a: { x: 1 } });
			expect(merge([[1, null], [undefined, 2]])).toEqual([1, 2]);
			expect(merge([new Map([["a", 1]]), new Map([["a", null]])])).toEqual(new Map([["a", 1]]));
		});

		it("should keep the last null or undefined if there are no other values", () => {
			expect(merge([{ a: undefined }, { a: null }])).toStrictEqual({ a: null });
			expect(merge([{ a: null }, { a: undefined }])).toStrictEqual({ a: undefined });
			expect(merge([{ a: null }, { b: 1 }])).toStrictEqual({ a: undefined, b: 1 });
		});
	});

	describe("arrays", () => {
		it("should merge arrays by index", () => {
			expect(merge([[1, 2, 3], [4]])).toEqual([4, 2, 3]);
			expect(merge([[1], [4, 5, 6]])).toEqual([4, 5, 6]);
			expect(merge([[{ a: 1 }, [1, 2]], [{ b: 2 }, [3]]])).toEqual([{ a: 1, b: 2 }, [3, 2]]);
			expect(merge([[], []])).toEqual([]);
		});

		it("should replace arrays and objects with each other", () => {
			expect(merge([{ a: [1, 2] }, { a: { 0: 3 } }])).toEqual({ a: { 0: 3 } });
			expect(merge([{ a: { 0: 3 } }, { a: [1, 2] }])).toEqual({ a: [1, 2] });
		});

		it("shouldn't copy properties of arrays that aren't elements", () => {
			const arr = Object.assign([1], { extra: true });
			expect(merge([arr, [2]])).toStrictEqual([2]);
		});
	});

	describe("Date and RegExp", () => {
		it("should replace dates and regular expressions by reference", () => {
			const date1 = new Date(1);
			const date2 = new Date(2);
			const regexp = /b/gu;
			expect(merge([{ d: date1 }, { d: date2 }]).d).toBe(date2);
			expect(merge([{ d: { x: 1 } }, { d: date1 }]).d).toBe(date1);
			expect(merge([{ d: date1 }, { d: { x: 1 } }]).d).toEqual({ x: 1 });
			expect(merge([{ r: /a/u }, { r: regexp }]).r).toBe(regexp);
		});
	});

	describe("Map", () => {
		it("should merge values with the same key", () => {
			const key = { id: 1 };
			const actual = merge([
				new Map<unknown, unknown>([["a", { x: 1 }], [key, [1, 2]], ["b", 1]]),
				new Map<unknown, unknown>([["a", { y: 2 }], [key, [3]], ["c", 2]]),
			]);
			expect(actual).toEqual(new Map<unknown, unknown>([["a", { x: 1, y: 2 }], [key, [3, 2]], ["b", 1], ["c", 2]]));
			expect([...actual.keys()][1]).toBe(key);
		});

		it("should replace maps and objects with each other", () => {
			const map = new Map([["a", 1]]);
			expect(merge([{ a: 1 }, map])).toEqual(map);
			expect(merge([map, { a: 1 }])).toEqual({ a: 1 });
		});

		it("shouldn't merge subclasses and weak maps", () => {
			class CustomMap extends Map<string, number> {}
			const custom = new CustomMap([["b", 2]]);
			const weakMap = new WeakMap();
			expect(merge([new Map([["a", 1]]), custom])).toBe(custom);
			expect(merge([new Map([["a", 1]]), weakMap])).toBe(weakMap);
		});
	});

	describe("Set", () => {
		it("should merge sets into a union and keep the values by reference", () => {
			const obj1 = { a: 1 };
			const obj2 = { a: 1 };
			const actual = merge([new Set([1, obj1]), new Set([obj2, 2, 1])]);
			expect([...actual]).toEqual([1, obj1, obj2, 2]);
			expect([...actual][1]).toBe(obj1);
			expect([...actual][2]).toBe(obj2);
		});

		it("shouldn't merge subclasses", () => {
			class CustomSet extends Set<number> {}
			const custom = new CustomSet([2]);
			expect(merge([new Set([1]), custom])).toBe(custom);
		});
	});

	describe("class instances", () => {
		class Base {
			base = "base";
			get computed(): string {
				return this.base.toUpperCase();
			}

			method(): string {
				return this.base;
			}
		}
		class Derived extends Base {
			derived = 1;
		}

		it("should merge own properties into a plain object", () => {
			const actual = merge([new Derived(), { extra: true }]);
			expect(actual).toStrictEqual({ base: "base", derived: 1, extra: true });
			expect(Object.getPrototypeOf(actual)).toBe(Object.prototype);
			expect("method" in actual).toBe(false);
			expect("computed" in actual).toBe(false);
		});

		it("shouldn't merge instances with Symbol.toStringTag", () => {
			class Tagged {
				readonly [Symbol.toStringTag] = "Tagged";
				a = 1;
			}
			const tagged = new Tagged();
			expect(merge([{ b: 2 }, tagged])).toBe(tagged);
			expect(merge([tagged, { b: 2 }])).toEqual({ b: 2 });
		});
	});

	describe("objects without a prototype", () => {
		it("should merge them into a plain object", () => {
			const obj1 = Object.assign(Object.create(null) as Record<string, unknown>, { a: 1, o: { x: 1 } });
			const obj2 = Object.assign(Object.create(null) as Record<string, unknown>, { b: 2, o: { y: 2 } });
			const actual = merge([obj1, obj2]);
			expect(actual).toEqual({ a: 1, b: 2, o: { x: 1, y: 2 } });
			expect(Object.getPrototypeOf(actual)).toBe(Object.prototype);
			expect(merge([obj1])).toBe(obj1);
		});
	});

	describe("symbol keys", () => {
		it("should merge values with symbol keys", () => {
			const symbol = Symbol("symbol");
			expect(merge([{ [symbol]: { a: 1 }, b: 1 }, { [symbol]: { c: 3 } }])).toEqual({ [symbol]: { a: 1, c: 3 }, b: 1 });
		});

		it("should copy non-enumerable own properties as enumerable ones", () => {
			const symbol = Symbol("symbol");
			const source = Object.defineProperties({}, { hidden: { value: 1 }, [symbol]: { value: 2 } });
			const actual = merge([source, { a: 3 }]);
			expect(Object.getOwnPropertyDescriptor(actual, "hidden")).toEqual({ value: 1, writable: true, enumerable: true, configurable: true });
			expect(Object.getOwnPropertyDescriptor(actual, symbol)?.enumerable).toBe(true);
		});
	});

	describe("getters and setters", () => {
		it("should copy values of getters as data properties", () => {
			const getter = jest.fn(() => ({ x: 1 }));
			const source = Object.defineProperty({}, "value", { get: getter, enumerable: true });
			const actual = merge([source, { value: { y: 2 } }]);
			expect(actual).toEqual({ value: { x: 1, y: 2 } });
			expect(getter).toHaveBeenCalledTimes(1);
			expect(Object.getOwnPropertyDescriptor(actual, "value")).toEqual({
				value: { x: 1, y: 2 },
				writable: true,
				enumerable: true,
				configurable: true,
			});
		});

		it("should use undefined for setters without getters", () => {
			const setter = jest.fn();
			// eslint-disable-next-line accessor-pairs -- a setter without a getter is tested on purpose
			const source = Object.defineProperty({}, "value", { set: (value: unknown): void => { setter(value); }, enumerable: true });
			expect(merge([{ value: 1 }, source])).toEqual({ value: 1 });
			expect(merge([source, { other: 1 }])).toStrictEqual({ value: undefined, other: 1 });
			expect(setter).not.toHaveBeenCalled();
		});

		it("should throw errors of getters", () => {
			const source = Object.defineProperty({}, "value", {
				get: () => { throw new Error("getter error"); },
				enumerable: true,
			});
			expect(() => merge([source, { a: 1 }])).toThrow("getter error");
		});
	});

	describe("other non-mergeable values", () => {
		it("should replace functions, typed arrays, promises and errors by reference", () => {
			const fn = (): void => {};
			const bytes = new Uint8Array([1, 2]);
			const promise = Promise.resolve();
			const error = new Error("error");
			const actual = merge([
				{ fn: { a: 1 }, bytes: [1, 2, 3], promise: {}, error: {} },
				{ fn, bytes, promise, error },
			]);
			expect(actual.fn).toBe(fn);
			expect(actual.bytes).toBe(bytes);
			expect(actual.promise).toBe(promise);
			expect(actual.error).toBe(error);
		});
	});

	describe("shared references", () => {
		it("should keep values of a single source by reference", () => {
			const shared = { x: 1 };
			const actual = merge([{ a: shared }, { b: 2 }]);
			expect(actual.a).toBe(shared);
		});

		it("should merge the same objects once", () => {
			const shared1 = { x: 1 };
			const shared2 = { y: 2 };
			const actual = merge([{ a: shared1, b: shared1 }, { a: shared2, b: shared2 }]);
			expect(actual.a).toEqual({ x: 1, y: 2 });
			expect(actual.a).toBe(actual.b);
		});

		it("should merge an object with itself into a copy", () => {
			const obj = { a: { b: 1 } };
			const actual = merge([obj, obj]);
			expect(actual).toEqual(obj);
			expect(actual).not.toBe(obj);
			expect(actual.a).not.toBe(obj.a);
		});
	});

	describe("immutability", () => {
		it("shouldn't mutate frozen arguments", () => {
			type Circular = { a: number; self?: Circular; arr: unknown[]; };
			const createArgs = () => {
				const circular: Circular = { a: 1, arr: [1, { x: 1 }] };
				circular.self = circular;
				return [
					circular,
					{ b: 2, arr: [2], nested: { x: 1 } },
					{ a: 3, arr: [undefined, { y: 2 }], nested: { y: 2 } },
				] as const;
			};
			const args = deepFreeze(createArgs());
			const actual = merge(args);
			expect(args).toEqual(createArgs());
			expect(actual).toEqual({ a: 3, b: 2, self: args[0], arr: [2, { x: 1, y: 2 }], nested: { x: 1, y: 2 } });
		});

		it("shouldn't share merged objects with the arguments", () => {
			const obj1: { a: { x: number; }; arr: [{ y: number; }]; } = { a: { x: 1 }, arr: [{ y: 1 }] };
			const obj2: { a: { z: number; }; arr: [{ w: number; }]; } = { a: { z: 2 }, arr: [{ w: 2 }] };
			const actual = merge([obj1, obj2]);
			actual.a.x = 42;
			actual.arr[0].y = 42;
			expect(obj1).toEqual({ a: { x: 1 }, arr: [{ y: 1 }] });
			expect(obj2).toEqual({ a: { z: 2 }, arr: [{ w: 2 }] });
		});
	});

	describe("prototype pollution", () => {
		const emptyObject: Record<string, unknown> = {};

		it("should merge __proto__ keys as own properties", () => {
			const obj1 = JSON.parse("{ \"__proto__\": { \"x\": 1 } }") as Record<string, unknown>;
			const obj2 = JSON.parse("{ \"__proto__\": { \"y\": 2 } }") as Record<string, unknown>;
			const actual = merge([obj1, obj2]);
			expect(Object.getPrototypeOf(actual)).toBe(Object.prototype);
			expect(Object.getOwnPropertyDescriptor(actual, "__proto__")?.value).toEqual({ x: 1, y: 2 });
			expect(emptyObject["x"]).toBeUndefined();
			expect(emptyObject["y"]).toBeUndefined();
		});

		it("should merge nested __proto__ keys as own properties", () => {
			const source = JSON.parse("{ \"a\": { \"__proto__\": { \"polluted\": true } } }") as { a: Record<string, unknown>; };
			const actual = merge([{ a: { b: 1 } }, source]);
			expect(Object.getPrototypeOf(actual.a)).toBe(Object.prototype);
			expect(Object.keys(actual.a)).toEqual(["b", "__proto__"]);
			expect(emptyObject["polluted"]).toBeUndefined();
		});
	});
});
