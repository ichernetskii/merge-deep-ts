export type Equal<X, Y> =
	(<T>() => T extends X ? 1 : 2) extends
	(<T>() => T extends Y ? 1 : 2) ? true : false;

export function assert<T extends true>(): T { return true as T; }
