# [Merge-Deep-TS](https://www.npmjs.com/package/merge-deep-ts)

![GitHub package.json version](https://img.shields.io/github/package-json/v/ichernetskii/merge-deep-ts)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/merge-deep-ts)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/ichernetskii/merge-deep-ts/publish.yml)
![Testspace pass ratio](https://img.shields.io/testspace/pass-ratio/ichernetskii/ichernetskii:merge-deep-ts/master?label=passed)
[![Coverage Status](https://coveralls.io/repos/github/ichernetskii/merge-deep-ts/badge.svg?branch=ci)](https://coveralls.io/github/ichernetskii/merge-deep-ts?branch=ci)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://img.shields.io/github/license/ichernetskii/merge-deep-ts)

Deep fast merge JavaScript objects with circular references handling and TypeScript support

## Installation

```sh
# Install with npm
npm install deep-merge-ts
```
```sh
# Install with yarn
yarn add deep-merge-ts
```

## Usage

Once the package is installed, you can import the library using import or require approach:

```js
import merge from "merge-deep-ts";
```

or

```js
const merge = require("merge-deep-ts").default;
```

## Features

* Merges deeply objects
* Supports Object, Array, Map or Set merge
* Input objects can have any circular references
* Fast algorithm with caching
* Strongly typed merged result with TypeScript

## Example

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

// book: {
//     title: string;
//     year: number;
//     price: {
//         value: number;
//         currency: string;
//     };
// };
```
#### result:
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

```typescript
const titles = [
    { title: "Harry Potter" },
    { title: "Lord of the Rings" }
];

const authors = [
    { author: "J. K. Rowling", birthYear: 1965 },
    { author: "J. R. R. Tolkien" }
];

const info = [
    { year: 1997 },
    { year: 1954, ISBN: "123-456-789" }
];

const books = merge([titles, authors, info]);

// books: Array<{
//     title: string;
//     author: string;
//     birthYear: number;
//     year: number;
//     ISBN: string;
// }>;
```

#### result:

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

#### result:

```
Map {
  name => "iPhone",
  model => "14 used",
  price => {
    value => 699,
    currency => "USD"
  },
  owners => [{
    name => "Alex",
    age => 35
  }, {
    name => "John", 
    age => 42
  }]
}
```

### *Sets*

```typescript
const set1 = new Set([1, 2, 3]);
const set2 = new Set([2, 3, 4]);
const mergedSet = merge([set1, set2]);
```

#### result:

```
Set { 1, 2, 3, 4 }
```

### *Circular references*

```typescript
const bookInfo = {
    title: "Harry Potter",
    year: 1997,
    author: {
        name: null,
        books: [] // → [bookInfo]
    }
};
bookInfo.author.books.push(bookInfo); // add circular reference

const bookDiscount = {
    title: "Harry Potter and the Philosopher's Stone",
    author: {
        name: "J. K. Rowling"
    }
};

const book = merge([bookInfo, bookDiscount]);
```

#### result:

```json5
{
  title: "Harry Potter and the Philosopher's Stone",
  year: 1997,
  author: {
    name: "J. K. Rowling",
    books: [/* Circular reference */]
  }
}
```

### *Circular cross-references*

```typescript
// object1 = { a: 1, o2: object2 }
// object2 = { b: 2, o1: object1 }
const object1 = { a: 1 };
const object2 = { b: 2 };
object1.o2 = object2;
object2.o1 = object1;

const merged = merge([object1, object2]);
```

#### result:

```json5
{
  a: 1,
  b: 2,
  o1: {
    a: 1,
    o2: [/* Circular reference → merged.o2 */]
  },
  o2: {
    b: 2,
    o1: [/* Circular reference → merged.o1 */]
  }
}
```
