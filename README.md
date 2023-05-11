# [Merge-Deep-TS](https://www.npmjs.com/package/merge-deep-ts) &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://img.shields.io/github/license/ichernetskii/merge-deep-ts) ![GitHub package.json version](https://img.shields.io/github/package-json/v/ichernetskii/merge-deep-ts) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/merge-deep-ts) ![GitHub top language](https://img.shields.io/github/languages/top/ichernetskii/merge-deep-ts)

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

```javascript
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

```js
const user1 = {
    name: "Alex",
    position: "Developer",
    age: 30,
    location: {
        country: "USA",
        city: "New York",
    }
};

const user2 = {
    position: "JS Developer",
    age: 35,
    location: {
        city: "San Francisco",
    },
};

const merged = merge([user1, user2]);
```
#### result:
```json5
{
  name: "Alex",
  position: "JS Developer",
  age: 35,
  location: {
    country: "USA",
    city: "San Francisco"
  }
}
```

### *Arrays*

```js
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

```js
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

```js
const set1 = new Set([1, 2, 3]);
const set2 = new Set([2, 3, 4]);
const mergedSet = merge([set1, set2]);
```

#### result:

```
Set { 1, 2, 3, 4 }
```
