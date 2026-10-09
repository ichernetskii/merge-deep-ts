# Contributing

The project uses Node.js 24+ and Yarn (enable it with `corepack enable`).

The code is compiled and type checked with TypeScript 7 (`tsc`). ESLint and Jest need the TypeScript 6 API, so the `typescript` package is [TypeScript 6](https://www.npmjs.com/package/@typescript/typescript6) (`tsc6`), as recommended for the transition period. Select TypeScript 7 in your editor (in WebStorm: Settings → Languages & Frameworks → TypeScript).

```sh
yarn install
yarn verify             # lint, type check, build, unit, type and smoke tests, package checks
yarn test:types-compat  # type tests of the packed package with TypeScript 4.9–7.x (installs them with npm)
```
