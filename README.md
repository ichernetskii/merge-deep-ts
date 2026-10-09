# [Merge-Deep-TS](https://www.npmjs.com/package/merge-deep-ts)

<a href="https://www.npmjs.com/package/merge-deep-ts">![GitHub package.json version](https://img.shields.io/github/package-json/v/ichernetskii/merge-deep-ts?logo=npm)</a>
<a href="https://bundlephobia.com/package/merge-deep-ts@latest">![npm bundle size](https://img.shields.io/bundlephobia/minzip/merge-deep-ts)</a>
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/ichernetskii/merge-deep-ts/ci.yml)
<a href="https://ichernetskii.testspace.com/spaces/220047">![Testspace pass ratio](https://img.shields.io/testspace/pass-ratio/ichernetskii/ichernetskii:merge-deep-ts/220047?label=passed%20tests)</a>
[![Coverage Status](https://coveralls.io/repos/github/ichernetskii/merge-deep-ts/badge.svg)](https://coveralls.io/github/ichernetskii/merge-deep-ts)
<a href="https://github.com/ichernetskii/merge-deep-ts/blob/master/LICENSE">[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://img.shields.io/github/license/ichernetskii/merge-deep-ts)</a>

Deep fast merge JavaScript objects with circular references handling and TypeScript support.

## Installation

```sh
npm install merge-deep-ts
```
```sh
yarn add merge-deep-ts
```
```sh
pnpm add merge-deep-ts
```

## Usage

`merge` takes a single array of values and returns the merged value. The package supports both ES modules and CommonJS:

```js
import merge from "merge-deep-ts";

merge([{ a: 1, o: { x: 1 } }, { b: 2, o: { y: 2 } }]); // { a: 1, b: 2, o: { x: 1, y: 2 } }
```

```js
const merge = require("merge-deep-ts").default;
```

## Features

* Merges objects deeply
* Supports Object, Array, Map or Set merge
* Input objects can have any circular references
* Fast algorithm with caching
* Strongly typed merged result with TypeScript
* No dependencies
* Small size
* Works in browser and Node.js, ES modules and CommonJS

## How values are merged

* **Left to right.** Arguments are merged from left to right, and later values replace earlier ones.
* **Objects** are merged key by key, including symbol keys. Plain objects, objects without a prototype (`Object.create(null)`) and class instances are merged into a new plain object:
  * only own properties are merged, inherited ones (e.g. class methods) aren't copied;
  * getters are called, and their values are copied as regular properties;
  * non-enumerable own properties are copied as enumerable ones;
  * an own `__proto__` key (e.g. from `JSON.parse`) is copied as a regular property, it never changes prototypes.
* **Arrays** are merged by index: `merge([[1, 2, 3], [4]])` is `[4, 2, 3]`.
* **Maps** are merged by key, the values with the same key are merged deeply.
* **Sets** are combined into a union, their values aren't merged.
* **`null` and `undefined`** never replace a value: `merge([{ a: 1 }, { a: null }])` is `{ a: 1 }`. If all values are `null` or `undefined`, the last one is used.
* **Other values replace the previous ones**: primitives, functions, `Date`, `RegExp`, typed arrays, promises, errors, subclasses of `Map` and `Set`, objects with `Symbol.toStringTag`. Values of different kinds (e.g. an object and an array) replace each other too.
* **A non-mergeable value discards everything merged before it**: `merge([{ a: 1 }, 42, { b: 2 }])` is `{ b: 2 }`.
* **Arguments are never mutated.** The merged objects are new, but values that come from a single argument are reused as is, without copying: in `merge([{ a: obj }, { b: 2 }])` the result's `a` is `obj` itself, and `merge([obj])` returns `obj`. Use `structuredClone` on the result if you need an independent copy.
* **Circular references and shared objects** are preserved: the same objects are merged in the same order only once.
* `merge([])` returns `null`. `merge` throws an error if the argument isn't an array.

## TypeScript

The type of the result is inferred from the types of the arguments and follows the rules above. The types work with TypeScript 4.9 and newer (tested with 4.9–7.x).

* Use `as const` to get literal types (see the examples below).
* For an array of unknown length (e.g. `Foo[]`) the result type is `Foo | null`, because the array can be empty.
* Limitations: the type of a merged class instance includes its methods, although methods aren't copied. Built-in classes without `Symbol.toStringTag` (e.g. `Error`, `URL`) are typed as objects merged key by key, although at runtime they replace the previous values.

## Examples

### *Objects*

```typescript
const bookInfo = {
    title: "Harry Potter",
    year: 1997,
    price: {
        value: 69,
        currency: "USD"
    }
};

const bookDiscount = {
    title: "Harry Potter and the Philosopher's Stone",
    price: {
        value: 49
    }
};

const book = merge([bookInfo, bookDiscount]);

// const book: {
//     title: string;
//     year: number;
//     price: {
//         value: number;
//         currency: string;
//     };
// };
```

You can use `as const` to get more precise types:

```typescript
const bookInfo = {
    title: "Harry Potter",
    year: 1997,
    price: {
        value: 69,
        currency: "USD"
    }
} as const;

const bookDiscount = {
    title: "Harry Potter and the Philosopher's Stone",
    price: {
        value: 49
    }
} as const;

const book = merge([bookInfo, bookDiscount]);

// const book: {
//     title: "Harry Potter and the Philosopher's Stone";
//     year: 1997;
//     price: {
//         value: 49;
//         currency: "USD";
//     };
// };
```

Runtime JS result:

```json5
{
  title: "Harry Potter and the Philosopher's Stone",
  year: 1997,
  price: {
    value: 49,
    currency: "USD"
  }
}
```

### *Arrays*
Arrays are merged by index. If the index is not present in the first array, the value is taken from the second array.

```typescript
const books = merge([
    [
        { title: "Harry Potter" },
        { title: "Lord of the Rings" }
    ], [
        { author: "J. K. Rowling", birthYear: 1965 },
        { author: "J. R. R. Tolkien" }
    ], [
        { year: 1997 },
        { year: 1954, ISBN: "123-456-789" }
    ],
]);

// const books: [{
//     title: string;
//     author: string;
//     year: number;
//     birthYear: number;
// }, {
//     title: string;
//     author: string;
//     year: number;
//     ISBN: string;
// }];
```

You can use `as const` to get more precise types:

```typescript
const titles = [
    { title: "Harry Potter" },
    { title: "Lord of the Rings" }
] as const;

const authors = [
    { author: "J. K. Rowling", birthYear: 1965 },
    { author: "J. R. R. Tolkien" }
] as const;

const info = [
    { year: 1997 },
    { year: 1954, ISBN: "123-456-789" }
] as const;

const books = merge([titles, authors, info]);

// const books: [{
//     title: "Harry Potter";
//     author: "J. K. Rowling";
//     birthYear: 1965;
//     year: 1997;
// }, {
//     title: "Lord of the Rings";
//     author: "J. R. R. Tolkien";
//     year: 1954;
//     ISBN: "123-456-789";
// }];
```

Runtime JS result:

```json5
[
  {
    title: "Harry Potter",
    author: "J. K. Rowling",
    birthYear: 1965,
    year: 1997
  }, {
    title: "Lord of the Rings",
    author: "J. R. R. Tolkien",
    year: 1954,
    ISBN: "123-456-789"
  }
]
```

### *Maps*

```typescript
const phone = new Map([
    ["name", "iPhone"],
    ["model", "14"],
    ["price", { value: 999, currency: "USD" }],
	["owners", [
            { name: "Alex", age: 30 }
    ]]
]);

const phoneUpdate = new Map([
    ["model", "14 used"],
    ["price", { value: 699, currency: "USD" }],
    ["owners", [
        { name: "Alex", age: 35 },
        { name: "John", age: 42 }
    ]]
]);

const updatedPhone = merge([phone, phoneUpdate]);
```

Runtime JS result:

```
Map(4) {
  "name" => "iPhone",
  "model" => "14 used",
  "price" => { value: 699, currency: "USD" },
  "owners" => [{ name: "Alex", age: 35 }, { name: "John", age: 42 }]
}
```

### *Sets*

```typescript
const set1 = new Set([1, 2, 3]);
const set2 = new Set([2, 3, 4]);
const mergedSet = merge([set1, set2]);
```

Runtime JS result:

```
Set { 1, 2, 3, 4 }
```

### *Circular references*

```js
const user = { name: "Alex" };
user.self = user;

const update = { age: 35 };
update.self = update;

const merged = merge([user, update]);
merged.self === merged; // true
```

Runtime JS result:

```json5
{
  name: "Alex",
  self: [/* Circular reference → merged */],
  age: 35
}
```

### *Circular cross-references*

```js
// object1 = { a: 1, o2: object2 }
// object2 = { b: 2, o1: object1 }
const object1 = { a: 1 };
const object2 = { b: 2 };
object1.o2 = object2;
object2.o1 = object1;

const merged = merge([object1, object2]);
```

Runtime JS result: `o1` and `o2` come from a single argument each, so they're reused as is.

```json5
{
  a: 1,
  o2: object2, // { b: 2, o1: object1 }
  b: 2,
  o1: object1  // { a: 1, o2: object2 }
}
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
