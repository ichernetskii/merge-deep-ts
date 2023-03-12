export interface WithValue { value: any; }
export type MergedObject<T1 extends MergeableObject, T2 extends MergeableObject> = {
	[Property in keyof T1 | keyof T2]:
	Property extends keyof T2
		? Property extends keyof T1
			? T1[Property] & T2[Property]
			: T2[Property]
		: Property extends keyof T1
			? T1[Property]
			: never;
};

export type MapKeys<T> = T extends Map<infer K, any> ? K : never;
export type MapValues<T> = T extends Map<any, infer V> ? V : never;
export type SetValues<T> = T extends Set<infer V> ? V : never;

export type MergeableObject = Record<string | number | symbol, unknown>;
export type MergeableArray = unknown[];
export type MergeableMap = Map<unknown, unknown>;
export type MergeableSet = Set<unknown>;
export type Nullable = null | undefined;
export type Mergeable = MergeableObject | MergeableArray | MergeableMap | MergeableSet;
export type NonMergeable<T> = T extends Mergeable | Nullable ? never : T;

export enum MergeableType {
	Object = "Object",
	Array = "Array",
	Set = "Set",
	Map = "Map",
	Nullable = "Nullable",
	NonMergeable = "NonMergeable",
}
export const isObject = (obj: unknown): obj is MergeableObject =>
	Object.prototype.toString.call(obj) === "[object Object]";
export const isArray = (obj: unknown): obj is MergeableArray => Array.isArray(obj);
export const isMap = (obj: unknown): obj is MergeableMap => !!obj && Object.getPrototypeOf(obj) === Map.prototype;
export const isSet = (obj: unknown): obj is MergeableSet => !!obj && Object.getPrototypeOf(obj) === Set.prototype;
export const isNullable = (obj: unknown): obj is null | undefined => obj === null || obj === undefined;
export const isMergeable = (obj: unknown): obj is Mergeable => isObject(obj) || isArray(obj) || isMap(obj) || isSet(obj);
export const getType = (obj: unknown): MergeableType => {
	if (isObject(obj)) { return MergeableType.Object; }
	if (isArray(obj)) { return MergeableType.Array; }
	if (isMap(obj)) { return MergeableType.Map; }
	if (isSet(obj)) { return MergeableType.Set; }
	if (isNullable(obj)) { return MergeableType.Nullable; }
	return MergeableType.NonMergeable;
};

export const getCounter = (() => {
	let counter = -1;
	return (reset = false) => reset ? counter = 0 : ++counter;
})();

export const ERROR_NOT_ARRAY = "Argument must be an array" as const;
