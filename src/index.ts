import type {
	Argument,
	Mergeable,
	MergeableArray,
	MergeableMap,
	MergeableObject,
	MergeableSet,
	MergedMany,
} from "./types.js";
import {
	ERROR_NOT_ARRAY,
	hasOwn,
	isArray,
	isMap,
	isNullable,
	isObject,
	isSet,
	setProperty,
} from "./utils.js";

/** State of a single `merge` call */
interface Context {
	/** Ids of traversed objects. Key - object, value - id */
	ids: Map<Mergeable, number>;
	/**
	 * Results of merging. Key - ids of merged objects in the merge order (e.g. "1:3:0"), value - result of merging.
	 * A result is cached before it's filled, so circular references resolve to it.
	 */
	cache: Map<string, Mergeable>;
}

/** Fills the target with the merged content of the sources */
type Fill<T extends Mergeable> = (target: T, sources: readonly T[], context: Context) => void;

const getId = (obj: Mergeable, context: Context): number => {
	let id = context.ids.get(obj);
	if (id === undefined) {
		id = context.ids.size;
		context.ids.set(obj, id);
	}
	return id;
};

/** Returns the trailing values that satisfy the guard */
const takeLast = <T>(values: readonly unknown[], guard: (value: unknown) => value is T): T[] => {
	const result: T[] = [];
	for (let i = values.length - 1; i >= 0; i--) {
		const value = values[i];
		if (!guard(value)) {
			break;
		}
		result.push(value);
	}
	return result.reverse();
};

const mergeSources = <T extends Mergeable>(sources: readonly T[], context: Context, create: () => T, fill: Fill<T>): Mergeable => {
	const key = sources.map(source => getId(source, context)).join(":");
	const cached = context.cache.get(key);
	if (cached !== undefined) {
		return cached;
	}
	const target = create();
	context.cache.set(key, target);
	fill(target, sources, context);
	return target;
};

/**
 * Merges values with circular references
 * @param values - values to merge
 * @param context - state of the current `merge` call
 * @returns The merged value
 */
function mergeValues(values: readonly unknown[], context: Context): unknown {
	if (values.length === 0) {
		return null;
	}
	const nonNullableValues = values.filter(value => !isNullable(value));
	// only null and undefined: the last one wins
	if (nonNullableValues.length === 0) {
		return values[values.length - 1];
	}
	// nothing to merge with: return the value itself
	if (nonNullableValues.length === 1) {
		return nonNullableValues[0];
	}
	// merge the trailing values of the same type as the last one, a non-mergeable last value wins
	const lastValue = nonNullableValues[nonNullableValues.length - 1];
	if (isObject(lastValue)) {
		return mergeSources(takeLast(nonNullableValues, isObject), context, () => ({}), fillObject);
	}
	if (isArray(lastValue)) {
		return mergeSources(takeLast(nonNullableValues, isArray), context, () => [], fillArray);
	}
	if (isMap(lastValue)) {
		return mergeSources(takeLast(nonNullableValues, isMap), context, () => new Map(), fillMap);
	}
	if (isSet(lastValue)) {
		return mergeSources(takeLast(nonNullableValues, isSet), context, () => new Set(), fillSet);
	}
	return lastValue;
}

const fillObject: Fill<MergeableObject> = (target, sources, context) => {
	const keys = new Set<PropertyKey>();
	for (const source of sources) {
		for (const key of Reflect.ownKeys(source)) {
			keys.add(key);
		}
	}
	for (const key of keys) {
		// inherited properties (e.g. `toString` or `__proto__`) of the sources without the key are ignored
		setProperty(target, key, mergeValues(sources.map(source => hasOwn(source, key) ? source[key] : undefined), context));
	}
};

const fillArray: Fill<MergeableArray> = (target, sources, context) => {
	const length = sources.reduce((max, source) => Math.max(max, source.length), 0);
	for (let index = 0; index < length; index++) {
		// skip the arrays that are too short, but keep their `undefined` elements and holes
		const values = sources.filter(source => index < source.length).map(source => source[index]);
		target[index] = mergeValues(values, context);
	}
};

const fillMap: Fill<MergeableMap> = (target, sources, context) => {
	const keys = new Set<unknown>();
	for (const source of sources) {
		for (const key of source.keys()) {
			keys.add(key);
		}
	}
	for (const key of keys) {
		target.set(key, mergeValues(sources.map(source => source.get(key)), context));
	}
};

const fillSet: Fill<MergeableSet> = (target, sources) => {
	for (const source of sources) {
		for (const value of source) {
			target.add(value);
		}
	}
};

/**
 * Deep merges all arguments into a single object. Objects could have circular references.
 * @param args Array of objects to merge
 * @returns The deeply merged object.
 * @example
 * import merge from "merge-deep-ts";
 * merge([{ a: 1 }, { b: 2 }]); // { a: 1, b: 2 }
 * merge([{ a: 1 }, { a: 2 }]); // { a: 2 }
 */
function merge<T extends readonly [] | readonly Argument[]>(args: T): MergedMany<T> {
	if (!Array.isArray(args)) {
		throw new Error(ERROR_NOT_ARRAY);
	}
	// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- the result type is computed from the argument types
	return mergeValues(args, { ids: new Map(), cache: new Map() }) as MergedMany<T>;
}

export default merge;
