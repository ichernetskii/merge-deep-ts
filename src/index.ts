import {
	ERROR_NOT_ARRAY,
	type MapKeys,
	type MapValues,
	type Mergeable,
	type MergeableArray,
	type MergeableMap,
	type MergeableObject,
	type MergeableSet,
	MergeableType,
	type MergedObject,
	type NonMergeable,
	type Nullable,
	type SetValues,
	type WithValue,
	getCounter,
	getType,
	isMergeable,
	isNullable,
} from "./utils";

/**
 * Merge objects with circular references
 * @param result - result object
 * @param args - array of objects to merge
 * @param cache - cached results of merging. Key - sorted string with ids of objects (e.g. "1:3:4:9"), value - result of merging
 * @param objects - map of traversed objects to their ids. Key - object, value - id
 */
function mergeCircular(
	result: WithValue,
	args: readonly Mergeable[],
	cache: Map<string, WithValue>,
	objects: WeakMap<Mergeable, number>,
): void {
	if (!Array.isArray(args)) {
		throw new Error(ERROR_NOT_ARRAY);
	}
	// filter out null and undefined
	const nonNullableArgs = args.filter(obj => !isNullable(obj));
	if (nonNullableArgs.length === 0) {
		result.value = args.at(-1);
		return;
	}
	// store mergeable arguments in the `objects` map
	for (const obj of nonNullableArgs) {
		if (!objects.has(obj) && isMergeable(obj)) {
			objects.set(obj, getCounter());
		}
	}
	// if there is only one or zero arguments, return it
	if (nonNullableArgs.length <= 1) {
		result.value = nonNullableArgs[0];
		return;
	}
	const lastArg = nonNullableArgs.at(-1);
	// if last argument isn't mergeable, return it
	const type = getType(lastArg);
	if (type === MergeableType.NonMergeable || type === MergeableType.Nullable) {
		result.value = lastArg;
		return;
	}
	// collect all mergeable arguments with the same type from the end
	let count = 1;
	for (let i = nonNullableArgs.length - 2; i >= 0; i--) {
		if (type !== getType(nonNullableArgs[i])) { break; }
		count++;
	}
	const mergeableArgs = nonNullableArgs.slice(-count);

	// check if we already have the result in cache
	const ids = mergeableArgs
		.map(obj => objects.get(obj))
		.sort()
		.join(":");
	const cached = cache.get(ids)?.value;
	if (cached) {
		// assign(result.value, cached);
		result.value = cached;
		return;
	} else {
		// store result in cache
		cache.set(ids, result);
	}

	// merge all mergeable arguments
	switch (type) {
		case MergeableType.Object: {
			// find all keys
			const keys = mergeableArgs.reduce(
				(acc, obj) => {
					for (const key of [...Object.getOwnPropertyNames(obj), ...Object.getOwnPropertySymbols(obj)]) {
						acc.add(key);
					}
					return acc;
				},
				new Set<string | number | symbol>(),
			);

			result.value = {};
			for (const key of keys) {
				// merge objects with the same key
				const values = mergeableArgs.map(obj => obj[key]);
				const mergedValues: WithValue = { value: undefined };
				mergeCircular(mergedValues, values, cache, objects);
				result.value[key] = mergedValues.value;
			}
			break;
		}
		case MergeableType.Array: {
			result.value = [];
			const maxLength = mergeableArgs.reduce((acc, arr) => Math.max(acc, arr.length), 0);
			for (let i = 0; i < maxLength; i++) {
				// merge objects with the same index
				const values = mergeableArgs.map(obj => obj[i]).filter(obj => obj !== undefined);
				const mergedValues: WithValue = { value: undefined };
				mergeCircular(mergedValues, values, cache, objects);
				result.value[i] = mergedValues.value;
			}
			break;
		}
		case MergeableType.Map: {
			// find all keys
			const keys = mergeableArgs.reduce(
				(acc, obj) => {
					for (const key of obj.keys()) {
						acc.add(key);
					}
					return acc;
				},
				new Set(),
			);

			result.value = new Map();
			for (const key of keys) {
				// merge objects with the same key
				const values = mergeableArgs.map(obj => obj.get(key));
				const mergedValues: WithValue = { value: undefined };
				mergeCircular(mergedValues, values, cache, objects);
				result.value.set(key, mergedValues.value);
			}
			break;
		}
		case MergeableType.Set: {
			result.value = mergeableArgs.reduce((acc, set) => {
				for (const value of set) {
					acc.add(value);
				}
				return acc;
			}, new Set());
			break;
		}
	}
}

/**
 * Deep merges all arguments into a single object. Objects could have circular references.
 * @param args Array of objects to merge
 * @returns The deeply merged object.
 * @example
 * import merge from "merge-fast";
 * merge([{ a: 1 }, { b: 2 }]); // { a: 1, b: 2 }
 * merge([{ a: 1 }, { a: 2 }]); // { a: 2 }
 */
function merge(args: Nullable[]): undefined;
// objects
function merge<T extends MergeableObject>(args: [T]): T;
function merge<T1 extends MergeableObject, T2 extends MergeableObject>(args: [T1, T2]): MergedObject<T1, T2>;
function merge<
	T1 extends MergeableObject,
	T2 extends MergeableObject,
	T3 extends MergeableObject,
>(args: [T1, T2, T3]): MergedObject<MergedObject<T1, T2>, T3>;
function merge<
	T1 extends MergeableObject,
	T2 extends MergeableObject,
	T3 extends MergeableObject,
	T4 extends MergeableObject,
>(args: [T1, T2, T3, T4]): MergedObject<MergedObject<MergedObject<T1, T2>, T3>, T4>;
// arrays
function merge<T extends MergeableArray>(args: [T]): T;
function merge<T1 extends MergeableArray, T2 extends MergeableArray>(args: [T1, T2]): T1 & T2;
function merge<
	T1 extends MergeableArray,
	T2 extends MergeableArray,
	T3 extends MergeableArray,
>(args: [T1, T2, T3]): T1 & T2 & T3;
function merge<
	T1 extends MergeableArray,
	T2 extends MergeableArray,
	T3 extends MergeableArray,
	T4 extends MergeableArray,
>(args: [T1, T2, T3, T4]): T1 & T2 & T3 & T4;
// maps
function merge<T extends MergeableMap>(args: [T]): T;
function merge<
	T1 extends MergeableMap,
	T2 extends MergeableMap,
>(args: [T1, T2]): Map<MapKeys<T1> | MapKeys<T2>, MapValues<T1> | MapValues<T2>>;
function merge<
	T1 extends MergeableMap,
	T2 extends MergeableMap,
	T3 extends MergeableMap,
>(args: [T1, T2, T3]): Map<MapKeys<T1> | MapKeys<T2> | MapKeys<T3>, MapValues<T1> | MapValues<T2> | MapValues<T3>>;
function merge<
	T1 extends MergeableMap,
	T2 extends MergeableMap,
	T3 extends MergeableMap,
	T4 extends MergeableMap,
>(args: [T1, T2, T3, T4]): Map<
	MapKeys<T1> | MapKeys<T2> | MapKeys<T3> | MapKeys<T4>,
	MapValues<T1> | MapValues<T2> | MapValues<T3> | MapValues<T4>
>;
// sets
function merge<T extends MergeableSet>(args: [T]): T;
function merge<
	T1 extends MergeableSet,
	T2 extends MergeableSet,
>(args: [T1, T2]): Set<SetValues<T1> | SetValues<T2>>;
function merge<Last>(args: [...any[], NonMergeable<Last>]): NonMergeable<Last>;
function merge(args: any[]): any;
function merge(args: any[]): any {
	const result: WithValue = { value: undefined };
	mergeCircular(result, args, new Map(), new WeakMap());
	return result.value;
}

export default merge;
