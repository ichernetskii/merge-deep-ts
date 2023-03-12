import { MergeableType, getCounter, getType } from "../utils";

describe("getCounter", () => {
	it("should return counter", () => {
		expect(getCounter()).toEqual(0);
		expect(getCounter()).toEqual(1);
		expect(getCounter()).toEqual(2);
		expect(getCounter(true)).toEqual(0);
		expect(getCounter(true)).toEqual(0);
		expect(getCounter()).toEqual(1);
		expect(getCounter()).toEqual(2);
	});
});

describe("getType", () => {
	it("should return type", () => {
		expect(getType({ a: 1 })).toEqual(MergeableType.Object);
		expect(getType([1, 2])).toEqual(MergeableType.Array);
		expect(getType(new Set([1, 2]))).toEqual(MergeableType.Set);
		expect(getType(new Map([["a", 1], ["b", 2]]))).toEqual(MergeableType.Map);
		expect(getType(null)).toEqual(MergeableType.Nullable);
		expect(getType(undefined)).toEqual(MergeableType.Nullable);
		expect(getType(1)).toEqual(MergeableType.NonMergeable);
		expect(getType("a")).toEqual(MergeableType.NonMergeable);
		expect(getType(true)).toEqual(MergeableType.NonMergeable);
		expect(getType(false)).toEqual(MergeableType.NonMergeable);
		expect(getType(Symbol(""))).toEqual(MergeableType.NonMergeable);
		expect(getType(() => {})).toEqual(MergeableType.NonMergeable);
		expect(getType(/.*/)).toEqual(MergeableType.NonMergeable);
		expect(getType(new Float64Array())).toEqual(MergeableType.NonMergeable);
		expect(getType(new Date())).toEqual(MergeableType.NonMergeable);
	});
});
