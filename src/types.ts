export type Nullable = null | undefined;
export type MergeableObject = Record<PropertyKey, unknown>;
export type MergeableArray = unknown[];
export type MergeableMap = Map<unknown, unknown>;
export type MergeableSet = Set<unknown>;
export type Mergeable = MergeableObject | MergeableArray | MergeableMap | MergeableSet;

/**
 * Contextual type of a `merge` argument. It accepts any value, makes TypeScript infer array literals
 * (nested ones too) as tuples and doesn't narrow primitives to literal types (`boolean` isn't listed explicitly
 * for this reason: it's a union of `true` and `false` literals).
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- `{}` is the only type that accepts any non-nullish value without adding literal types to the context
export type Argument = {} | Nullable | [] | [Argument, ...Argument[]] | { [key: PropertyKey]: Argument; };

/**
 * Objects that replace previous values like primitives do. At runtime only objects with the `[object Object]`
 * tag are merged key by key, and built-in classes with `Symbol.toStringTag` (typed arrays, promises, etc.) aren't.
 */
type NonMergeableObject =
	| ((...args: never[]) => unknown)
	| (abstract new (...args: never[]) => unknown)
	| Date
	| RegExp
	| { readonly [Symbol.toStringTag]: string; };

/** Plain objects, class instances and interfaces are merged key by key */
type IsMergeableObject<T> = T extends readonly unknown[] | MergeableMap | MergeableSet | NonMergeableObject
	? false
	: T extends object ? true : false;

type OptionalKeys<T> = { [Key in keyof T]-?: T extends Record<Key, T[Key]> ? never : Key; }[keyof T];

/** Flattens an intersection into a single object type (`& {}` makes editors display the properties) */
type Simplify<T> = { [Key in keyof T]: T[Key]; } & {};

/** Result of `merge([T1, T2])` */
export type Merged<T1, T2> =
	T1 extends Nullable
		? T2 // [Nullable, T2] -> T2
		: T2 extends Nullable
			? T1 // [T1, Nullable] -> T1
			: IsMergeableObject<T1> extends true
				? IsMergeableObject<T2> extends true
					? MergedObject<T1, T2> // [MergeableObject, MergeableObject] -> MergedObject<T1, T2>
					: T2 // [MergeableObject, T2] -> T2
				: T1 extends readonly unknown[]
					? T2 extends readonly unknown[]
						? MergedArray<T1, T2> // [MergeableArray, MergeableArray] -> MergedArray<T1, T2>
						: T2 // [MergeableArray, T2] -> T2
					: T1 extends MergeableMap
						? T2 extends MergeableMap
							? MergedMap<T1, T2> // [MergeableMap, MergeableMap] -> MergedMap<T1, T2>
							: T2 // [MergeableMap, T2] -> T2
						: T1 extends MergeableSet
							? T2 extends MergeableSet
								? MergedSet<T1, T2> // [MergeableSet, MergeableSet] -> MergedSet<T1, T2>
								: T2 // [MergeableSet, T2] -> T2
							: T2; // [NonMergeable, T2] -> T2

/**
 * Keys of only one object keep their modifiers, keys of both objects are optional only if they're optional in both.
 * The result is mutable: it's a new object.
 */
export type MergedObject<T1, T2> = Simplify<
	& { -readonly [Key in keyof T1 as Key extends keyof T2 ? never : Key]: T1[Key]; }
	& { -readonly [Key in keyof T2 as Key extends keyof T1 ? never : Key]: T2[Key]; }
	& { -readonly [Key in keyof T1 & keyof T2 as Key extends OptionalKeys<T1> & OptionalKeys<T2> ? never : Key]-?: Merged<T1[Key], T2[Key]>; }
	& { -readonly [Key in keyof T1 & keyof T2 as Key extends OptionalKeys<T1> & OptionalKeys<T2> ? Key : never]?: Merged<T1[Key], T2[Key]>; }
>;

type IsTuple<T extends readonly unknown[]> = number extends T["length"] ? false : true;

/** Tuples are merged element by element, arrays of unknown length produce an array of all possible elements */
export type MergedArray<T1 extends readonly unknown[], T2 extends readonly unknown[]> =
	IsTuple<T1> extends true
		? IsTuple<T2> extends true
			? MergedTuple<T1, T2>
			: Array<T1[number] | T2[number] | Merged<T1[number], T2[number]>>
		: Array<T1[number] | T2[number] | Merged<T1[number], T2[number]>>;

type MergedTuple<T1 extends readonly unknown[], T2 extends readonly unknown[]> =
	T1 extends readonly [infer First1, ...infer Rest1]
		? T2 extends readonly [infer First2, ...infer Rest2]
			? [Merged<First1, First2>, ...MergedTuple<Rest1, Rest2>]
			: [...T1]
		: [...T2];

export type MergedMap<T1 extends MergeableMap, T2 extends MergeableMap> = T1 extends Map<infer K1, infer V1>
	? T2 extends Map<infer K2, infer V2>
		? Map<K1 | K2, V1 | V2>
		: never
	: never;

export type MergedSet<T1 extends MergeableSet, T2 extends MergeableSet> = Set<
	| (T1 extends Set<infer Value1> ? Value1 : never)
	| (T2 extends Set<infer Value2> ? Value2 : never)
>;

/** Result of `merge(T)`: arguments are merged from left to right */
export type MergedMany<T extends readonly unknown[]> =
	T extends readonly [infer First, ...infer Rest]
		? MergedRest<First, Rest>
		: T extends readonly []
			? null // [] -> null
			: Merged<T[number], T[number]> | null; // array of unknown length, it can be empty

type MergedRest<Result, Rest extends readonly unknown[]> =
	Rest extends readonly [infer Next, ...infer Tail]
		? MergedRest<Merged<Result, Next>, Tail>
		: Rest extends readonly []
			? Result
			: Merged<Result, MergedMany<Rest>>;
