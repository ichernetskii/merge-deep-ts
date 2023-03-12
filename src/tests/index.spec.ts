import { ERROR_NOT_ARRAY, type MergedObject } from "../utils";
import merge from "../index";

describe("merge-fast tests", () => {
	it("should merge two objects", () => {
		const mockFn = jest.fn();
		const symbol1 = Symbol("symbol1");
		const symbol2 = Symbol("symbol2");
		expect(merge([{
			a: 1,
			b: 2,
			obj: { a: 10, b: 11 },
			objA: { x: 1 },
			[symbol1]: 42,
			arr: [{ a: 1 }, { value: 1 }, [1, 2], mockFn],
			set: new Set([1, 2, 3]),
			map: new Map<any, any>([["x", 42], ["y", 43], ["obj", { a: 10, b: 11 }], [symbol2, 100]]),
			fn: mockFn,
			bytes: new Uint8Array([1, 2, 3]),
		}, {
			a: "new a",
			set: new Set([2, 4, 3, 5]),
			obj: { a: 42, b: 11 },
			objB: { y: 2 },
			arr: [{ b: 2 }, { value: 42 }, [3, { x: 4 }]],
			map: new Map<any, any>([["obj", { a: 12, c: 20 }], ["y", 1], ["z", 44]]),
			c: 3,
			[symbol2]: {},
		}])).toEqual({
			a: "new a",
			b: 2,
			c: 3,
			obj: { a: 42, b: 11 },
			objA: { x: 1 },
			objB: { y: 2 },
			arr: [{ a: 1, b: 2 }, { value: 42 }, [3, { x: 4 }], mockFn],
			set: new Set([1, 2, 3, 4, 5]),
			map: new Map<any, any>([["x", 42], ["y", 1], ["obj", { a: 12, b: 11, c: 20 }], [symbol2, 100], ["z", 44]]),
			[symbol1]: 42,
			[symbol2]: {},
			fn: mockFn,
			bytes: new Uint8Array([1, 2, 3]),
		});
	});

	it("should merge two deep objects", () => {
		const car = {
			engine: {
				type: "V8",
				cylinders: 8,
				manufacturer: "Ford",
				oil: {
					type: "synthetic",
					brand: "Castrol",
					price: {
						value: {
							amount: 10,
							currency: "USD",
						},
					},
				},
			},
			wheels: 4,
		};

		const bike = {
			engine: {
				type: "V4",
				cylinders: 4,
				manufacturer: "Honda",
				oil: {
					type: "synthetic",
					brand: "Castrol",
					price: {
						value: {
							amount: 15,
						},
					},
				},
			},
			wheels: 2,
		};

		const actual = merge([car, bike]);
		expect(actual).toEqual({
			engine: {
				type: "V4",
				cylinders: 4,
				manufacturer: "Honda",
				oil: {
					type: "synthetic",
					brand: "Castrol",
					price: {
						value: {
							amount: 15,
							currency: "USD",
						},
					},
				},
			},
			wheels: 2,
		});
	});

	it("should merge two class instances", () => {
		const mockFn = jest.fn();
		class A {
			a = 1;
			b = 2;
			fn = mockFn;
			foo(): void {} // methods go to the prototype
		}

		class B {
			a = "new a";
			c = 3;
			bar(): void {}
		}
		expect(merge([new A(), new B()])).toEqual({ a: "new a", b: 2, c: 3, fn: mockFn });
	});

	it("should merge with null or undefined", () => {
		expect(merge([null, { a: 1 }])).toEqual({ a: 1 });
		expect(merge([{ a: 1 }, undefined])).toEqual({ a: 1 });
		expect(merge([undefined, null, { a: 1 }])).toEqual({ a: 1 });
		expect(merge([
			{ val: { a: null, b: { x: 1 }, c: undefined } },
			{ val: { a: null, b: { x: undefined }, c: undefined } },
		])).toEqual({ val: { a: null, b: { x: 1 }, c: undefined } });
	});

	it("should merge or throw error on merge objects with different types", () => {
		expect(merge([{ a: 1 }, [1, 2, 3]])).toEqual([1, 2, 3]);
	});

	it("should merge three objects", () => {
		expect(merge([{ a: 1 }, { b: 2 }, { c: 3, a: 42 }])).toEqual({ a: 42, b: 2, c: 3 });
	});

	it("should return the first object if there are no other objects to merge", () => {
		const obj = { a: 1 };
		expect(merge([obj])).toBe(obj);
	});

	it("should return undefined if there are no objects to merge", () => {
		expect(merge([])).toBeUndefined();
	});

	describe("circular references", () => {
		describe("circular references in objects", () => {
			describe("should merge { a: 1, o: obj1 } + { b: 2 }", () => {
				type Obj1 = { a: number; o?: Obj1; }
				type Obj2 = { b: number; }
				const obj1: Obj1 = { a: 1 }; // obj1 = { a: 1, o: obj1 }
				const obj2: Obj2 = { b: 2 }; // obj2 = { b: 2 }
				obj1.o = obj1;

				it.each([[obj1, obj2], [obj2, obj1]])("should merge { a: 1, o: obj1 } + { b: 2 }, test: %#", (...arr) => {
					const actual = merge(arr);
					expect(actual).not.toBe(actual.o);
					expect(actual.o).toBe(actual.o.o);

					const expected: MergedObject<Obj1, Obj2> = { a: 1, b: 2, o: { a: 1 } };
					if (expected.o) { expected.o.o = expected.o; }
					expect(actual).toEqual(expected);
					expect(obj1).not.toBe(actual);
					expect(obj2).not.toBe(actual);
				});
			});

			describe("should merge { a: 1, o1: obj1 } + { b: 2, o2: obj2 }", () => {
				type Obj1 = { a: number; o1?: Obj1; }
				type Obj2 = { b: number; o2?: Obj2; }
				const obj1: Obj1 = { a: 1 }; // obj1 = { a: 1, o1: obj1 }
				const obj2: Obj2 = { b: 2 }; // obj2 = { b: 2, o2: obj2 }
				obj1.o1 = obj1;
				obj2.o2 = obj2;

				it.each([[obj1, obj2], [obj2, obj1]])("should merge { a: 1, o1: obj1 } + { b: 2, o2: obj2 }, test: %#", (...arr) => {
					const actual = merge(arr);
					expect(actual).not.toBe(actual.o1);
					expect(actual).not.toBe(actual.o2);
					expect(actual.o1).toBe(actual.o1.o1);
					expect(actual.o2).toBe(actual.o2.o2);
					// expect(arr).not.toContain(actual.o1);
					// expect(arr).not.toContain(actual.o2);

					const expected: MergedObject<Obj1, Obj2> = { a: 1, b: 2, o1: { a: 1 }, o2: { b: 2 } };
					if (expected.o1) { expected.o1.o1 = expected.o1; }
					if (expected.o2) { expected.o2.o2 = expected.o2; }
					expect(actual).toEqual(expected);
					expect(obj1).not.toBe(actual);
					expect(obj2).not.toBe(actual);
				});
			});

			describe("should merge { a: 1, value: { o: obj1 } } + { b: 2, value: { c: 3 } }", () => {
				type Obj1 = { a: number; value: { o?: Obj1; }; }
				type Obj2 = { b: number; value: { c: number; }; }
				const obj1: Obj1 = { a: 1, value: {} }; // obj1 = { a: 1, value: { o: obj1 } }
				const obj2: Obj2 = { b: 2, value: { c: 3 } }; // obj2 = { b: 2, value: { c: 3 } }
				obj1.value.o = obj1;

				it.each([[obj1, obj2], [obj2, obj1]])("should merge { a: 1, value: { o: obj1 } } + { b: 2, value: { c: 3 } }, test: %#", (...arr) => {
					const actual = merge(arr);
					expect(actual).not.toBe(actual.value.o);
					expect(actual.value).not.toBe(actual.value.o.value);
					expect(actual.value.o).toBe(actual.value.o.value.o);

					const expected: MergedObject<Obj1, Obj2> = { a: 1, b: 2, value: { c: 3, o: { a: 1, value: {} } } };
					if (expected.value.o) { expected.value.o.value.o = expected.value.o; }
					expect(actual).toEqual(expected);
					expect(obj1).not.toBe(actual);
					expect(obj2).not.toBe(actual);
				});
			});

			describe("should merge { a: 1, o1: obj1, o2: obj1 } + { b: 2 }", () => {
				type Obj1 = { a: number; o1?: Obj1; o2?: Obj1; }
				type Obj2 = { b: number; }
				const obj1: Obj1 = { a: 1 }; // obj1 = { a: 1, o1: obj1, o2: obj1 }
				const obj2: Obj2 = { b: 2 }; // obj2 = { b: 2 }
				obj1.o1 = obj1;
				obj1.o2 = obj1;

				it.each([[obj1, obj2], [obj2, obj1]])("should merge { a: 1, o1: obj1, o2: obj1 } + { b: 2 }, test: %#", (...arr) => {
					const actual = merge(arr);
					expect(actual).not.toBe(actual.o1);
					expect(actual).not.toBe(actual.o2);
					expect(actual.o1).toBe(actual.o1.o1);
					expect(actual.o1).toBe(actual.o1.o2);
					expect(actual.o1).toBe(actual.o2);
					expect(actual.o1).toBe(actual.o2.o1);
					expect(actual.o1).toBe(actual.o2.o2);

					const expected: MergedObject<Obj1, Obj2> = { a: 1, b: 2, o1: { a: 1 }, o2: { a: 1 } };
					if (expected.o1) {
						expected.o1.o1 = expected.o1;
						expected.o1.o2 = expected.o1;
					}
					expected.o2 = expected.o1;
					expect(actual).toEqual(expected);
					expect(obj1).not.toBe(actual);
					expect(obj2).not.toBe(actual);
				});
			});

			describe("should merge { a: 1, o2: obj2 } + { b: 2, o1: obj1 }", () => {
				type Obj1 = { a: number; o2?: Obj2; }
				type Obj2 = { b: number; o1?: Obj1; }
				const obj1: Obj1 = { a: 1 }; // obj1 = { a: 1, o2: obj2 }
				const obj2: Obj2 = { b: 2 }; // obj2 = { b: 2, o1: obj1 }
				obj1.o2 = obj2;
				obj2.o1 = obj1;

				it.each([[obj1, obj2], [obj2, obj1]])("should merge { a: 1, o2: obj2 } + { b: 2, o1: obj1 }, test: %#", (...arr) => {
					const actual = merge(arr);
					expect(actual).not.toBe(actual.o1);
					expect(actual).not.toBe(actual.o2);
					expect(actual.o1).toBe(actual.o2.o1);
					expect(actual.o1).toStrictEqual(actual.o2.o1);
					expect(actual.o2).toBe(actual.o1.o2);
					expect(actual.o2).toStrictEqual(actual.o1.o2);

					const expected: MergedObject<Obj1, Obj2> = { a: 1, b: 2, o1: { a: 1 }, o2: { b: 2 } };
					if (expected.o1) { expected.o1.o2 = expected.o2; }
					if (expected.o2) { expected.o2.o1 = expected.o1; }
					expect(actual).toEqual(expected);
					expect(obj1).toEqual(expected.o1);
					expect(obj2).toEqual(expected.o2);
				});
			});

			describe("should merge { a: 1, value: { o: obj2 } } + { b: 2, value: { c: 3 } }", () => {
				type Obj1 = { a: number; value: { o?: Obj2; }; };
				type Obj2 = { b: number; value: { c: number; }; };
				const obj1: Obj1 = { a: 1, value: {} }; // obj1 = { a: 1, value: { o: obj2 } }
				const obj2: Obj2 = { b: 2, value: { c: 3 } }; // obj2 = { b: 2, value: { c: 3 } }
				obj1.value.o = obj2;

				it.each([[obj1, obj2], [obj2, obj1]])("should merge { a: 1, value: { o: obj2 } } + { b: 2, value: { c: 3 } }, test: %#", (...arr) => {
					const actual = merge(arr);
					expect(actual).not.toBe(actual.value.o);
					expect(actual.obj2).toBe(actual.value.o.obj2);

					const expected: MergedObject<Obj1, Obj2> = { a: 1, b: 2, value: { c: 3, o: { b: 2, value: { c: 3 } } } };
					expect(actual).toEqual(expected);
				});
			});

			describe("should merge { a: 1, value: { o2: obj2 } } + { b: 2, value: { o1: obj1 } }", () => {
				type Obj1 = { a: number; value: { o2?: Obj2; }; };
				type Obj2 = { b: number; value: { o1?: Obj1; }; };
				const obj1: Obj1 = { a: 1, value: {} }; // obj1 = { a: 1, value: { o2: obj2 } }
				const obj2: Obj2 = { b: 2, value: {} }; // obj2 = { b: 2, value: { o1: obj1 } }
				obj1.value.o2 = obj2;
				obj2.value.o1 = obj1;

				it.each([[obj1, obj2], [obj2, obj1]])("should merge { a: 1, value: { o2: obj2 } } + { b: 2, value: { o1: obj1 } }, test: %#", (...arr) => {
					const actual = merge(arr);
					expect(actual).not.toBe(actual.value.o1);
					expect(actual).not.toBe(actual.value.o2);
					expect(actual.value.o2).toBe(actual.value.o1.value.o2);
					expect(actual.value.o2).toStrictEqual(actual.value.o1.value.o2);
					expect(actual.value.o1).toBe(actual.value.o2.value.o1);
					expect(actual.value.o1).toStrictEqual(actual.value.o2.value.o1);

					const expected: MergedObject<Obj1, Obj2> = {
						a: 1,
						b: 2,
						value: {
							o1: { a: 1, value: {} },
							o2: { b: 2, value: {} },
						},
					};
					if (expected.value.o1) { expected.value.o1.value.o2 = expected.value.o2; }
					if (expected.value.o2) { expected.value.o2.value.o1 = expected.value.o1; }
					expect(actual).toEqual(expected);
					expect(obj1).toEqual(expected.value.o1);
					expect(obj2).toEqual(expected.value.o2);
				});
			});

			describe("should merge { a: 1, o: obj1 } + { b: 2, o: obj2 }", () => {
				type Obj1 = { a: number; o?: Obj1; }
				type Obj2 = { b: number; o?: Obj2; }
				const obj1: Obj1 = { a: 1 }; // obj1 = { a: 1, o: obj1 }
				const obj2: Obj2 = { b: 2 }; // obj2 = { b: 2, o: obj2 }

				obj1.o = obj1;
				obj2.o = obj2;

				// cross references
				type Obj3 = { a: number; o?: Obj4; }
				type Obj4 = { b: number; o?: Obj3; }
				const obj3: Obj3 = { a: 1 }; // obj3 = { a: 1, o: obj4 }
				const obj4: Obj4 = { b: 2 }; // obj4 = { b: 2, o: obj3 }
				obj3.o = obj4;
				obj4.o = obj3;

				it.each([[obj1, obj2], [obj2, obj1], [obj3, obj4], [obj4, obj3]])("should merge { a: 1, o: obj1 } + { b: 2, o: obj2 }, test: %#", (...arr) => {
					const actual = merge(arr);
					expect(actual).toBe(actual.o);
					expect(actual.o).toBe(actual.o.o);

					const expected: MergedObject<Obj1, Obj2> = { a: 1, b: 2, o: { a: 1, b: 2 } };
					expected.o = expected;
					expect(actual).toEqual(expected);
				});
			});

			describe("should merge { a: 1, value: { o: obj1 } } + { b: 2, value: { o: obj2 } }", () => {
				type Obj1 = { a: number; value: { o?: Obj1; }; };
				type Obj2 = { b: number; value: { o?: Obj2; }; };
				const obj1: Obj1 = { a: 1, value: {} }; // obj1 = { a: 1, value: { o: obj1 } }
				const obj2: Obj2 = { b: 2, value: {} }; // obj2 = { b: 2, value: { o: obj2 } }
				obj1.value.o = obj1;
				obj2.value.o = obj2;

				// cross references
				type Obj3 = { a: number; value: { o?: Obj4; }; };
				type Obj4 = { b: number; value: { o?: Obj3; }; };
				const obj3: Obj3 = { a: 1, value: {} }; // obj3 = { a: 1, value: { o: obj4 } }
				const obj4: Obj4 = { b: 2, value: {} }; // obj4 = { b: 2, value: { o: obj3 } }
				obj3.value.o = obj4;
				obj4.value.o = obj3;

				it.each([[obj1, obj2], [obj2, obj1], [obj3, obj4], [obj4, obj3]])("should merge { a: 1, value: { o: obj1 } } + { b: 2, value: { o: obj2 } }, test: %#", (...arr) => {
					const actual = merge(arr);
					expect(actual).toBe(actual.value.o);
					expect(actual.value.o).toBe(actual.value.o.value.o);

					const expected: MergedObject<Obj1, Obj2> = { a: 1, b: 2, value: { o: { a: 1, b: 2, value: {} } } };
					expected.value.o = expected;
					expect(actual).toEqual(expected);
				});
			});

			describe("should merge { a: 1, value2: { o: obj2 } } + { b: 2, value1: { o: obj1 } }", () => {
				type Obj1 = { a: number; value2: { o?: Obj2; }; };
				type Obj2 = { b: number; value1: { o?: Obj1; }; };
				const obj1: Obj1 = { a: 1, value2: {} }; // obj1 = { a: 1, value2: { o: obj2 } }
				const obj2: Obj2 = { b: 2, value1: {} }; // obj2 = { b: 2, value1: { o: obj1 } }
				obj1.value2.o = obj2;
				obj2.value1.o = obj1;

				it.each([[obj1, obj2], [obj2, obj1]])("should merge { a: 1, value2: { o: obj2 } } + { b: 2, value1: { o: obj1 } }, test: %#", (...arr) => {
					const actual = merge(arr);
					expect(actual.value2.o).toBe(actual.value1.o.value2.o);

					const expected: MergedObject<Obj1, Obj2> = { a: 1, b: 2, value2: { o: { b: 2, value1: {} } }, value1: { o: { a: 1, value2: {} } } };
					if (expected.value2.o) { expected.value2.o.value1 = expected.value1; }
					if (expected.value1.o) { expected.value1.o.value2 = expected.value2; }
					expect(actual).toEqual(expected);
				});
			});

			describe("should merge { a: 1, o: obj2 } } + { b: 2, value: { o: obj1 } }", () => {
				type Obj1 = { a: number; o?: Obj2; };
				type Obj2 = { b: number; value: { o?: Obj1; }; };
				const obj1: Obj1 = { a: 1 }; // obj1 = { a: 1, o: obj2 } }
				const obj2: Obj2 = { b: 2, value: {} }; // obj2 = { b: 2, value: { o: obj1 } }
				obj1.o = obj2;
				obj2.value.o = obj1;

				it.each([[obj1, obj2], [obj2, obj1]])("should merge { a: 1, o: obj2 } } + { b: 2, value: { o: obj1 } }, test: %#", (...arr) => {
					const actual = merge(arr);
					expect(actual.o).toBe(actual.value.o.o);
					expect(actual.value.o).toBe(actual.o.value.o);

					const expected: MergedObject<Obj1, Obj2> = { a: 1, b: 2, o: { b: 2, value: {} }, value: { o: { a: 1, o: { b: 2, value: {} } } } };
					if (expected.o) { expected.o.value = expected.value; }
					if (expected.value.o) { expected.value.o.o = expected.o; }
					expect(actual).toEqual(expected);
				});
			});

			it("should merge { a: 1, o: obj } + { a: 1, o: obj }", () => {
				type Obj = { a: number; o?: Obj; };
				const obj: Obj = { a: 1 };
				obj.o = obj;

				const actual = merge([obj, obj]);
				expect(actual).toBe(actual.o);
				const expected: Obj = { a: 1 };
				expected.o = expected;
				expect(actual).toEqual(expected);
			});
		});

		describe("circular references in arrays", () => {
			it("should merge [ 1, arr1 ] + [ 2 ]", () => {
				type Arr = [number, Arr?];
				const arr1: Arr = [1]; // arr1 = [ 1, arr1 ]
				const arr2 = [2]; // arr2 = [ 2 ]
				arr1.push(arr1);

				let actual = merge([arr1, arr2]); // → [ 2, [1, arr1] ]
				expect(actual).not.toBe(actual[1]);
				expect(actual[1]).toBe(actual[1]?.[1]);
				let expected: Arr = [2, [1]];
				expected[1]?.push(expected[1]);
				expect(actual).toEqual(expected);
				expect(actual).not.toBe(expected);

				actual = merge([arr2, arr1]); // → [ 1, [1, arr1] ]
				expect(actual).not.toBe(actual[1]);
				expect(actual[1]).toBe(actual[1]?.[1]);
				expected = [1, [1]];
				expected[1]?.push(expected[1]);
				expect(actual).toEqual(expected);
				expect(actual).not.toBe(expected);
			});

			it("should merge [ 1, arr1 ] + [ 2, arr2 ]", () => {
				type Arr = [number, Arr?];
				const arr1: Arr = [1]; // arr1 = [ 1, arr1 ]
				const arr2: Arr = [2]; // arr2 = [ 2, arr2 ]
				arr1.push(arr1);
				arr2.push(arr2);

				let actual = merge([arr1, arr2]); // → [ 2, actual ]
				expect(actual).toBe(actual[1]);
				expect(actual[1]).toBe(actual[1]?.[1]);
				let expected: Arr = [2];
				expected.push(expected);
				expect(actual).toEqual(expected);
				expect(actual).not.toBe(expected);

				actual = merge([arr2, arr1]); // → [ 1, actual ]
				expect(actual).toBe(actual[1]);
				expect(actual[1]).toBe(actual[1]?.[1]);
				expected = [1];
				expected.push(expected);
				expect(actual).toEqual(expected);
				expect(actual).not.toBe(expected);
			});
		});

		describe("circular references in maps", () => {
			describe("should merge map{ a: 1, o2: map2 } + map{ b: 2, o1: map1 }", () => {
				type Map1 = Map<string, number | Map2>;
				type Map2 = Map<string, number | Map1>;
				const map1: Map1 = new Map([["a", 1]]); // map1 = { a: 1, o2: map2 }
				const map2: Map2 = new Map([["b", 2]]); // map2 = { b: 2, o1: map1 }
				map1.set("o2", map2);
				map2.set("o1", map1);

				it.each([[map1, map2], [map2, map1]])("should merge map{ a: 1, o2: map2 } + map{ b: 2, o1: map1 }, test: %#", (...arr) => {
					const actual = merge(arr);
					expect(actual).not.toBe(actual.get("o1"));
					expect(actual).not.toBe(actual.get("o2"));
					expect(actual.get("o1")).toBe((actual.get("o2") as Map<"o1", Map1>).get("o1"));
					expect(actual.get("o1")).toStrictEqual((actual.get("o2") as Map<"o1", Map1>).get("o1"));
					expect(actual.get("o2")).toBe((actual.get("o1") as Map<"o2", Map2>).get("o2"));
					expect(actual.get("o2")).toStrictEqual((actual.get("o1") as Map<"o2", Map2>).get("o2"));

					type MapExpected = Map<string, number | MapExpected>;
					const expected = new Map<string, number | MapExpected>([
						["a", 1],
						["b", 2],
						["o1", new Map([["a", 1]])],
						["o2", new Map([["b", 2]])],
					]);
					(expected.get("o1") as Map<"o2", Map2>).set("o2", expected.get("o2") as Map<"o2", Map2>);
					(expected.get("o2") as Map<"o1", Map1>).set("o1", expected.get("o1") as Map<"o1", Map1>);

					expect(actual.get("o1")).toStrictEqual(expected.get("o1"));
					expect(actual.get("o2")).toStrictEqual(expected.get("o2"));
					expect(map1).toEqual(actual.get("o1"));
					expect(map2).toEqual(actual.get("o2"));
				});
			});
		});

		describe("circular references in sets", () => {
			describe("should merge set{ 1, o2: set2 } + set{ 2, o1: set1 }", () => {
				type Set1 = Set<number | Set2>;
				type Set2 = Set<number | Set1>;
				const set1: Set1 = new Set([1]); // set1 = { 1, set2 }
				const set2: Set2 = new Set([2]); // set2 = { 2, set1 }
				set1.add(set2);
				set2.add(set1);

				it.each([[set1, set2], [set2, set1]])("should merge set{ 1, o2: set2 } + set{ 2, o1: set1 }, test: %#", (...arr) => {
					const actual = merge(arr);
					expect(actual.has(1)).toBeTruthy();
					expect(actual.has(2)).toBeTruthy();
					expect(actual.has(set2)).toBeTruthy();
					expect(actual.has(set1)).toBeTruthy();
				});
			});
		});
	});

	describe("immutability of arguments", () => {
		describe("shouldn't mutate objects", () => {
			const obj1 = { a: 1, obj: { x: 42 }, arr: [0, 1], map: new Map([["a", 1], ["b", 2]]) };
			const obj2 = { b: 2, obj: { x: 43, y: 10 } };
			const obj3 = { c: 3, arr: [2, 3], map: new Map([["a", 42], ["b", 2]]) };

			it.each([
				[obj1, obj2, obj3],
				[obj1, obj3, obj2],
				[obj2, obj1, obj3],
				[obj2, obj3, obj1],
				[obj3, obj1, obj2],
				[obj3, obj2, obj1],
			])("shouldn't mutate objects, test: %#", (...arr) => {
				merge(arr);
				expect(obj1).toEqual({ a: 1, obj: { x: 42 }, arr: [0, 1], map: new Map([["a", 1], ["b", 2]]) });
				expect(obj2).toEqual({ b: 2, obj: { x: 43, y: 10 } });
				expect(obj3).toEqual({ c: 3, arr: [2, 3], map: new Map([["a", 42], ["b", 2]]) });
			});
		});

		it("shouldn't mutate objects with symbols", () => {
			const symbol1 = Symbol("symbol1");
			const symbol2 = Symbol("symbol2");
			const obj1 = { [symbol1]: 1, [symbol2]: 2 };
			const obj2 = { [symbol1]: 42 };
			merge([obj1, obj2]);
			expect(obj1).toEqual({ [symbol1]: 1, [symbol2]: 2 });
			expect(obj2).toEqual({ [symbol1]: 42 });
		});

		it("shouldn't mutate arrays", () => {
			const arr1 = [1, 2, 3];
			const arr2 = [4, 5, 6];
			merge([arr1, arr2]);
			expect(arr1).toEqual([1, 2, 3]);
			expect(arr2).toEqual([4, 5, 6]);
		});

		it("shouldn't mutate maps", () => {
			const map1 = new Map([["a", 1], ["b", 2]]);
			const map2 = new Map([["a", 42], ["b", 2]]);
			merge([map1, map2]);
			expect(map1).toEqual(new Map([["a", 1], ["b", 2]]));
			expect(map2).toEqual(new Map([["a", 42], ["b", 2]]));
		});

		it("shouldn't mutate sets", () => {
			const set1 = new Set([1, 2, 3]);
			const set2 = new Set([2, 3, 4]);
			merge([set1, set2]);
			expect(set1).toEqual(new Set([1, 2, 3]));
			expect(set2).toEqual(new Set([2, 3, 4]));
		});
	});

	describe("TypeScript tests", () => {
		it("should return right type", () => {
			function assertType<T>(expression: T): asserts expression is T {}
			assertType<{ a: number; b: number; o: { x: number; y: number; }; }>(merge([{ a: 1, o: { x: 11 } }, { b: 2, o: { y: 22 } }]));
			assertType<{ a: boolean; b: number; c: number; }>(merge([{ a: 1 }, { b: 2, a: "w" }, { c: 3, a: true }]));
			assertType<{ a: number; b: number; }>(merge([{ a: 1, b: "22" }, { b: 2 }]));
			assertType<{ a: number; }>(merge([{ a: 1 }]));
			assertType<undefined>(merge([]));
			assertType<undefined>(merge([undefined]));
			assertType<undefined>(merge([null]));
			assertType<undefined>(merge([undefined, null]));
			assertType<undefined>(merge([null, undefined]));
			assertType<number>(merge(["str", {}, [], 1]));
			assertType<boolean>(merge([{ a: 1 }, true]));
			assertType<any>(merge([{}, []]));
			assertType<any>(merge([{}, [42]]));
			assertType<any>(merge([{ a: 1 }, 2, { b: 2 }]));
		});

		it("should return error", () => {
			// @ts-expect-error Assertion error
			expect(() => merge({})).toThrow(ERROR_NOT_ARRAY);
			// @ts-expect-error Assertion error
			expect(() => merge({ a: 1 })).toThrow(ERROR_NOT_ARRAY);
			// @ts-expect-error Assertion error
			expect(() => merge(42)).toThrow(ERROR_NOT_ARRAY);
		});
	});
});
