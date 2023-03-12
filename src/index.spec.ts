import merge from "./index";

describe("merge-fast tests", () => {
	it("should return sum of two numbers", () => {
		expect(merge(1, 2)).toBe(3);
	});
});
