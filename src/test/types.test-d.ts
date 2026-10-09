/**
 * Type tests. They are checked by the compiler (`yarn test:types`) and never executed.
 */
import { expectTypeOf } from "expect-type";
import merge from "../index.js";

// objects
expectTypeOf(merge([{ a: 1, o: { x: 11 } }, { b: 2, o: { y: 22 } }]))
	.toEqualTypeOf<{ a: number; b: number; o: { x: number; y: number; }; }>();
expectTypeOf(merge([{ a: 1 }, { a: "1" }])).toEqualTypeOf<{ a: string; }>();
expectTypeOf(merge([{ a: 1 }, { b: 2, a: "w" }, { c: 3, a: true }])).toEqualTypeOf<{ a: boolean; b: number; c: number; }>();
expectTypeOf(merge([{ a: 1, b: "22" }, { b: 2 }])).toEqualTypeOf<{ a: number; b: number; }>();
expectTypeOf(merge([{ a: 1 }])).toEqualTypeOf<{ a: number; }>();
expectTypeOf(merge([
	{ a: { b: { c: 1, arr: [{ x: 1 }, 1] } } },
	{ a: { x: true, b: { c: "str", arr: [{ x: "1", y: 42 }] } } },
])).toEqualTypeOf<{ a: { x: boolean; b: { c: string; arr: [{ x: string; y: number; }, number]; }; }; }>();

// symbol keys
const symbol: unique symbol = Symbol("symbol");
expectTypeOf(merge([{ [symbol]: { a: 1 } }, { [symbol]: { b: 2 } }])).toEqualTypeOf<{ [symbol]: { a: number; b: number; }; }>();

// optional properties stay optional unless the other object has the key
declare const optional: { b?: number; c?: number; };
expectTypeOf(merge([{ a: 1, c: 2 }, optional])).toEqualTypeOf<{ a: number; b?: number; c: number; }>();
expectTypeOf(merge([optional, { a: 1 }])).toEqualTypeOf<{ a: number; b?: number; c?: number; }>();
expectTypeOf(merge([optional, optional])).toEqualTypeOf<{ b?: number; c?: number; }>();
expectTypeOf(merge([optional, { b: "1" }])).toEqualTypeOf<{ b: string; c?: number; }>();

// interfaces and class instances are merged like plain objects
interface WithX { o: { x: number; }; a: number; }
interface WithY { o: { y: number; }; b: string; }
declare const withX: WithX;
declare const withY: WithY;
expectTypeOf(merge([withX, withY])).toEqualTypeOf<{ a: number; b: string; o: { x: number; y: number; }; }>();
class Point { x = 1; }
class Label { text = "a"; }
expectTypeOf(merge([new Point(), new Label()])).toEqualTypeOf<{ x: number; text: string; }>();

// the result is a new mutable object, a single argument is returned as is
expectTypeOf(merge([{ a: 1 } as const, { b: 2 } as const])).toEqualTypeOf<{ a: 1; b: 2; }>();
expectTypeOf(merge([{ a: 1 } as const])).toEqualTypeOf<{ readonly a: 1; }>();

// arrays and tuples
expectTypeOf(merge([
	[{ a: 1, b: true }, { c: 1, arr: [1, 2] }, [{ a: 1 }], "42"],
	[{ b: 2 }, { c: true, arr: ["42"] }, [{ a: "1" }], 42, 100],
])).toEqualTypeOf<[{ a: number; b: number; }, { c: boolean; arr: [string, number]; }, [{ a: string; }], number, number]>();
expectTypeOf(merge([
	[{ a: 1, b: true }, { c: 1, arr: [1, 2] }, [{ a: 1 }], "42"] as const,
	[{ b: 2 }, { c: true, arr: ["42"] }, [{ a: "1" }], 42, 100] as const,
])).toEqualTypeOf<[{ a: 1; b: 2; }, { c: true; arr: ["42", 2]; }, [{ a: "1"; }], 42, 100]>();
expectTypeOf(merge([{}, []])).toEqualTypeOf<[]>();
expectTypeOf(merge([{}, [42]])).toEqualTypeOf<[number]>();
expectTypeOf(merge([[1, undefined], [2]])).toEqualTypeOf<[number, undefined]>();
declare const strings: string[];
declare const numbers: number[];
expectTypeOf(merge([[1, 2], strings])).toEqualTypeOf<Array<number | string>>();
expectTypeOf(merge([strings, numbers])).toEqualTypeOf<Array<string | number>>();
expectTypeOf(merge([numbers, numbers])).toEqualTypeOf<number[]>();

// maps and sets
expectTypeOf(merge([
	new Map<string | boolean, number | number[]>([["a", 1], [true, [1]]]),
	new Map([["b", undefined]]),
])).toEqualTypeOf<Map<string | boolean, number | number[] | undefined>>();
expectTypeOf(merge([new Set(["a", true]), new Set(["b", 42])])).toEqualTypeOf<Set<string | boolean | number>>();

// non-mergeable values replace the previous ones
expectTypeOf(merge([1])).toEqualTypeOf<number>();
expectTypeOf(merge([1, 2])).toEqualTypeOf<number>();
expectTypeOf(merge(["str", {}, [], 1])).toEqualTypeOf<number>();
expectTypeOf(merge([{ a: 1 }, true])).toEqualTypeOf<boolean>();
expectTypeOf(merge([{ a: 1 }, new Date()])).toEqualTypeOf<Date>();
expectTypeOf(merge([{ a: { x: 1 } }, { a: /re/u }])).toEqualTypeOf<{ a: RegExp; }>();
expectTypeOf(merge([{ a: { x: 1 } }, { a: (): number => 1 }])).toEqualTypeOf<{ a: () => number; }>();
declare const bytes: Uint8Array;
expectTypeOf(merge([{ a: { x: 1 } }, { a: bytes }])).toEqualTypeOf<{ a: Uint8Array; }>();
expectTypeOf(merge([{ a: { x: 1 } }, { a: Promise.resolve(1) }])).toEqualTypeOf<{ a: Promise<number>; }>();
expectTypeOf(merge([{ a: { x: 1 } }, { a: [1] }])).toEqualTypeOf<{ a: [number]; }>();
expectTypeOf(merge([{ a: [1] }, { a: new Set([1]) }])).toEqualTypeOf<{ a: Set<number>; }>();

// arguments are merged from left to right
expectTypeOf(merge([42, { a: 1 }, { b: 2 }])).toEqualTypeOf<{ a: number; b: number; }>();
expectTypeOf(merge([{ a: 1 }, 42, { b: 2 }])).toEqualTypeOf<{ b: number; }>();
expectTypeOf(merge([{ a: 1 }, { b: 2 }, 42])).toEqualTypeOf<number>();
expectTypeOf(merge([{ a: 1 }, 42, { b: 2 }, { c: 3 }])).toEqualTypeOf<{ b: number; c: number; }>();
expectTypeOf(merge([{ a: 1 }, { b: 2 }, 42, { c: 3 }])).toEqualTypeOf<{ c: number; }>();

// null and undefined
expectTypeOf(merge([])).toBeNull();
expectTypeOf(merge([undefined])).toBeUndefined();
expectTypeOf(merge([null])).toBeNull();
expectTypeOf(merge([undefined, null])).toBeNull();
expectTypeOf(merge([null, undefined])).toBeUndefined();
expectTypeOf(merge([undefined, null, undefined])).toBeUndefined();
expectTypeOf(merge([null, 1])).toEqualTypeOf<number>();
expectTypeOf(merge([1, null])).toEqualTypeOf<number>();
expectTypeOf(merge([{ a: 1 }, null, { b: 2 }])).toEqualTypeOf<{ a: number; b: number; }>();
expectTypeOf(merge([{ a: { x: 1 } }, { a: null }])).toEqualTypeOf<{ a: { x: number; }; }>();
declare const maybe: { a: number; } | undefined;
expectTypeOf(merge([maybe, { b: 1 }])).toEqualTypeOf<{ b: number; } | { a: number; b: number; }>();

// arguments of unknown length
declare const list: Array<{ a: number; }>;
expectTypeOf(merge(list)).toEqualTypeOf<{ a: number; } | null>();
declare const readonlyList: ReadonlyArray<{ a: number; }>;
expectTypeOf(merge(readonlyList)).toEqualTypeOf<{ a: number; } | null>();
declare const head: [{ a: number; }, ...Array<{ b: number; }>];
expectTypeOf(merge(head)).toEqualTypeOf<{ a: number; } | { a: number; b: number; }>();

// readonly arguments
const args = [{ a: 1 }, { b: 2 }] as const;
expectTypeOf(merge(args)).toEqualTypeOf<{ a: 1; b: 2; }>();

// README examples
const bookInfo = { title: "Harry Potter", year: 1997, price: { value: 69, currency: "USD" } };
const bookDiscount = { title: "Harry Potter and the Philosopher's Stone", price: { value: 49 } };
expectTypeOf(merge([bookInfo, bookDiscount]))
	.toEqualTypeOf<{ title: string; year: number; price: { value: number; currency: string; }; }>();
const bookInfoConst = { title: "Harry Potter", year: 1997, price: { value: 69, currency: "USD" } } as const;
const bookDiscountConst = { title: "Harry Potter and the Philosopher's Stone", price: { value: 49 } } as const;
expectTypeOf(merge([bookInfoConst, bookDiscountConst]))
	.toEqualTypeOf<{ title: "Harry Potter and the Philosopher's Stone"; year: 1997; price: { value: 49; currency: "USD"; }; }>();
const titles = [{ title: "Harry Potter" }, { title: "Lord of the Rings" }] as const;
const authors = [{ author: "J. K. Rowling", birthYear: 1965 }, { author: "J. R. R. Tolkien" }] as const;
const info = [{ year: 1997 }, { year: 1954, ISBN: "123-456-789" }] as const;
expectTypeOf(merge([titles, authors, info])).toEqualTypeOf<[
	{ title: "Harry Potter"; author: "J. K. Rowling"; birthYear: 1965; year: 1997; },
	{ title: "Lord of the Rings"; author: "J. R. R. Tolkien"; year: 1954; ISBN: "123-456-789"; },
]>();

// negative cases
// @ts-expect-error -- the argument must be an array
merge({});
// @ts-expect-error -- the argument must be an array
merge({ a: 1 });
// @ts-expect-error -- the argument must be an array
merge(42);
// @ts-expect-error -- the argument must be an array
merge("str");
// @ts-expect-error -- the argument is required
merge();
// @ts-expect-error -- `merge` takes a single array of arguments
merge({ a: 1 }, { b: 2 });
// @ts-expect-error -- the last value wins
expectTypeOf(merge([{ a: 1 }, { a: "1" }])).toEqualTypeOf<{ a: number; }>();
// @ts-expect-error -- a non-mergeable value replaces the merged objects
expectTypeOf(merge([{ a: 1 }, { b: 2 }, 42, { c: 3 }])).toEqualTypeOf<{ a: number; b: number; c: number; }>();
// @ts-expect-error -- an optional property isn't required
expectTypeOf(merge([{ a: 1 }, optional])).toEqualTypeOf<{ a: number; b: number | undefined; c: number | undefined; }>();
// @ts-expect-error -- a single argument is returned as is
expectTypeOf(merge([{ a: 1 } as const])).toEqualTypeOf<{ a: 1; }>();
// @ts-expect-error -- an empty argument list produces null
expectTypeOf(merge([])).toBeUndefined();
// @ts-expect-error -- the result doesn't have keys that the objects don't have
expectTypeOf(merge([{ a: 1 }, { b: 2 }])).toHaveProperty("c");
// @ts-expect-error -- arguments of unknown length can be empty, so the result can be null
expectTypeOf(merge(list)).toEqualTypeOf<{ a: number; }>();
