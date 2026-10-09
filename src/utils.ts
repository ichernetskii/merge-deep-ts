import type {
	MergeableArray,
	MergeableMap,
	MergeableObject,
	MergeableSet,
	Nullable,
} from "./types.js";

export const isObject = (obj: unknown): obj is MergeableObject =>
	Object.prototype.toString.call(obj) === "[object Object]";
export const isArray = (obj: unknown): obj is MergeableArray => Array.isArray(obj);
export const isMap = (obj: unknown): obj is MergeableMap => !!obj && Object.getPrototypeOf(obj) === Map.prototype;
export const isSet = (obj: unknown): obj is MergeableSet => !!obj && Object.getPrototypeOf(obj) === Set.prototype;
export const isNullable = (obj: unknown): obj is Nullable => obj === null || obj === undefined;

export const hasOwn = (obj: object, key: PropertyKey): boolean => Object.prototype.hasOwnProperty.call(obj, key);

/**
 * Sets an own enumerable property. Unlike an assignment, it defines `__proto__` as an own property
 * instead of changing the prototype of the target.
 */
export const setProperty = (target: MergeableObject, key: PropertyKey, value: unknown): void => {
	if (key === "__proto__") {
		Object.defineProperty(target, key, { value, writable: true, enumerable: true, configurable: true });
	} else {
		target[key] = value;
	}
};

export const ERROR_NOT_ARRAY = "Argument must be an array" as const;
