import { type Equal, assert } from "../types.js";
import { ERROR_NOT_ARRAY } from "../utils.js";
import merge from "../index.js";

describe("TypeScript tests", () => {
	it("should return right type", () => {
		const actual1 = merge([
			{ a: 1, o: { x: 11 } },
			{ b: 2, o: { y: 22 } },
		]);
		type expected1 = {
			a: number;
			b: number;
			o: { x: number; y: number; };
		};
		assert<Equal<expected1, typeof actual1>>();

		const actual2 = merge([{ a: 1 }, { a: "1" }]);
		type expected2 = { a: string; };
		assert<Equal<expected2, typeof actual2>>();

		const actual3 = merge([
			{ a: { b: { c: 1, arr: [{ x: 1 }, 1] } } },
			{ a: { x: true, b: { c: "str", arr: [{ x: "1", y: 42 }] } } }],
		);
		type expected3 = {
			a: {
				x: boolean;
				b: {
					c: string;
					arr: [{ x: string; y: number; }, number];
				};
			};
		}
		assert<Equal<expected3, typeof actual3>>();

		const actual4 = merge([
			[{ a: 1, b: true }, { c: 1, arr: [1, 2] }, [{ a: 1 }], "42"],
			[{ b: 2 }, { c: true, arr: ["42"] }, [{ a: "1" }], 42, 100],
		]);
		type expected4 = [
			{ a: number; b: number; },
			{ c: boolean; arr: [string, number]; },
			[{ a: string; }],
			number,
			number,
		]
		assert<Equal<expected4, typeof actual4>>();

		const actual4AsConst = merge([
			[{ a: 1, b: true }, { c: 1, arr: [1, 2] }, [{ a: 1 }], "42"] as const,
			[{ b: 2 }, { c: true, arr: ["42"] }, [{ a: "1" }], 42, 100] as const,
		]);
		type expected4AsConst = [
			{ a: 1; b: 2; },
			{ c: true; arr: ["42", 2]; },
			[{ a: "1"; }],
			42,
			100,
		]
		assert<Equal<expected4AsConst, typeof actual4AsConst>>();

		const actual5 = merge([{ a: 1 }, { b: 2, a: "w" }, { c: 3, a: true }]);
		type expected5 = { a: boolean; b: number; c: number; };
		assert<Equal<expected5, typeof actual5>>();

		const actual6 = merge([{ a: 1, b: "22" }, { b: 2 }]);
		type expected6 = { a: number; b: number; };
		assert<Equal<expected6, typeof actual6>>();

		const actual7 = merge([{ a: 1 }]);
		type expected7 = { a: number; };
		assert<Equal<expected7, typeof actual7>>();

		const actual8 = merge([]);
		type expected8 = null;
		assert<Equal<expected8, typeof actual8>>();

		const actual9 = merge([undefined]);
		type expected9 = undefined;
		assert<Equal<expected9, typeof actual9>>();

		const actual10 = merge([null]);
		type expected10 = null;
		assert<Equal<expected10, typeof actual10>>();

		const actual11 = merge([undefined, null]);
		type expected11 = null;
		assert<Equal<expected11, typeof actual11>>();

		const actual12 = merge([null, undefined]);
		type expected12 = undefined;
		assert<Equal<expected12, typeof actual12>>();

		const actual13 = merge([undefined, null, undefined]);
		type expected13 = undefined;
		assert<Equal<expected13, typeof actual13>>();

		const actual14 = merge([null, 1]);
		type expected14 = number;
		assert<Equal<expected14, typeof actual14>>();

		const actual15 = merge([1, null]);
		type expected15 = number;
		assert<Equal<expected15, typeof actual15>>();

		const actual16 = merge([1]);
		type expected16 = number;
		assert<Equal<expected16, typeof actual16>>();

		const actual17 = merge([1, 2]);
		type expected17 = number;
		assert<Equal<expected17, typeof actual17>>();

		const actual18 = merge(["str", {}, [], 1]);
		type expected18 = number;
		assert<Equal<expected18, typeof actual18>>();

		const actual19 = merge([{ a: 1 }, true]);
		type expected19 = boolean;
		assert<Equal<expected19, typeof actual19>>();

		const actual20 = merge([42, { a: 1 }, { b: 2 }]);
		type expected20 = { a: number; b: number; };
		assert<Equal<expected20, typeof actual20>>();

		const actual21 = merge([{ a: 1 }, 42, { b: 2 }]);
		type expected21 = { b: number; };
		assert<Equal<expected21, typeof actual21>>();

		const actual22 = merge([{ a: 1 }, { b: 2 }, 42]);
		type expected22 = number;
		assert<Equal<expected22, typeof actual22>>();

		const actual23 = merge([{ a: 1 }, 42, { b: 2 }, { c: 3 }]);
		type expected23 = { b: number; c: number; };
		assert<Equal<expected23, typeof actual23>>();

		const actual24 = merge([{ a: 1 }, null, { b: 2 }]);
		type expected24 = { a: number; b: number; };
		assert<Equal<expected24, typeof actual24>>();

		const actual25 = merge([{}, []]);
		type expected25 = [];
		assert<Equal<expected25, typeof actual25>>();

		const actual26 = merge([{}, [42]]);
		type expected26 = [number];
		assert<Equal<expected26, typeof actual26>>();

		const actual27 = merge([
			new Map<string | boolean, number | number[]>([["a", 1], [true, [1]]]),
			new Map([["b", undefined]]),
		]);
		type expected27 = Map<string | boolean, number | number[] | undefined>;
		assert<Equal<expected27, typeof actual27>>();

		const actual28 = merge([
			new Set(["a", true]),
			new Set(["b", 42]),
		]);
		type expected28 = Set<string | boolean | number>;
		assert<Equal<expected28, typeof actual28>>();
	});

	it("should return error", () => {
		// @ts-expect-error Expected error
		expect(() => merge({})).toThrow(ERROR_NOT_ARRAY);
		// @ts-expect-error Expected error
		expect(() => merge({ a: 1 })).toThrow(ERROR_NOT_ARRAY);
		// @ts-expect-error Expected error
		expect(() => merge(42)).toThrow(ERROR_NOT_ARRAY);
	});
});
