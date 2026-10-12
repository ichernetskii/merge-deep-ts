# Changelog

## 1.3.1 (2026-10-12)

### Fixed

- The bundle size badge in the README showed "rate limited by upstream service". It takes the minified and gzipped size from bundlejs.com instead of bundlephobia now.

## 1.3.0 (2026-10-10)

### Fixed

- **Types with TypeScript 5.1 and newer.** The result of every `merge(...)` call was typed as `null`. The types are tested with TypeScript 4.9–7.x now.
- Merging the same objects in a different order returned a wrong cached result. For example, `merge([{ p: x, q: y }, { p: y, q: x }])` returned `merge([x, y])` for both `p` and `q`.
- `undefined` elements and holes of arrays became `null`: `merge([[1, undefined], [2]])` returned `[2, null]` instead of `[2, undefined]`.
- An own `__proto__` key (e.g. from `JSON.parse`) changed the prototype of the result. It's merged as an own property now. `Object.prototype` was never changed.
- Inherited properties of an argument replaced own properties of the previous arguments: `merge([{ toString: "a" }, { b: 1 }]).toString` was `Object.prototype.toString` instead of `"a"`.
- Result types:
  - arguments are merged from left to right: `merge([{ a: 1 }, { b: 2 }, 42, { c: 3 }])` is `{ c: number }`, not `{ a: number; b: number; c: number }`;
  - arrays of unknown length (`merge(list)`) produce `T | null` instead of `null`;
  - interfaces and class instances are merged like plain objects instead of taking the type of the last argument;
  - optional properties stay optional, and the merged object isn't `readonly`;
  - readonly (`as const`) argument lists are accepted;
  - a tuple merged with an array of unknown length produces an array instead of the tuple type.
- Type declarations for CommonJS. `require("merge-deep-ts")` used declarations in the ES module format, and the `types` condition was the last one in `exports`.

### Changed

- Objects that reference each other: if `a.o === b` and `b.o === a`, then `merge([a, b]).o` is `merge([b, a])` now, a separate object whose `o` refers back to the result. Before, it was the result itself, which was wrong when `a` and `b` had different values for the same keys.
- Type declarations moved from `dist/index.d.ts` to `dist/mjs/index.d.ts` and `dist/cjs/index.d.ts`. Imports of `merge-deep-ts` resolve them automatically.
- `merge` has a single type parameter: the tuple of the arguments.
- The package is marked as side effect free (`"sideEffects": false`) for bundlers.
- Merging is 20–40% faster.

## 1.2.15 and earlier

See [GitHub releases](https://github.com/ichernetskii/merge-deep-ts/releases).
