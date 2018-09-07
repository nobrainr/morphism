# Morphism

<!-- <div style="text-align:center">
<img src="https://i.imgur.com/4muW6u2.jpg" width="800px">
</div> -->

[![NPM version][npm-image]][npm-url] [![Coverage percentage][coveralls-image]][coveralls-url]
[![CircleCI](https://img.shields.io/circleci/project/github/nobrainr/morphism.svg)](https://circleci.com/gh/nobrainr/morphism)
![npm](https://img.shields.io/npm/dm/morphism.svg?style=flat-square)
[![gzip size](http://img.badgesize.io/https://unpkg.com/morphism/dist/morphism.js?compression=gzip)](https://unpkg.com/morphism/dist/morphism.js) [![Dependency Status][daviddm-image]][daviddm-url]

> In many fields of mathematics, morphism refers to a structure-preserving map from one mathematical structure to another. A morphism **f** with source **X** and target **Y** is written **f : X → Y**. Thus a morphism is represented by an arrow from its **source** to its **target**.

_https://en.wikipedia.org/wiki/Morphism_

- :atom_symbol: Write your schema once, Transform your data everywhere
- :zero: Zero dependencies
- :zap: [1.6 kB gzipped](https://bundlephobia.com/result?p=morphism@0.9.1)

[Morph Github Activity Feed](https://repl.it/@yrnd1/morphism-playground)

---

- [Morphism](#morphism)
  - [Getting started 🚀](#getting-started-%F0%9F%9A%80)
    - [Installation](#installation)
    - [Example](#example)
  - [Motivation](#motivation)
  - [Docs 🍔](#docs-%F0%9F%8D%94)
    - [Morphism Mixin](#morphism-mixin)
    - [Morphism Function](#morphism-function)
  - [More examples 💡](#more-examples-%F0%9F%92%A1)
    - [Flattening or Projection](#flattening-or-projection)
    - [Function over a source property's value](#function-over-a-source-propertys-value)
    - [Function over a source property](#function-over-a-source-property)
    - [Properties Aggregation](#properties-aggregation)
    - [API 📚](#api-%F0%9F%93%9A)
      - [Register](#register)
      - [Map](#map)
      - [Get or Set an existing mapper configuration](#get-or-set-an-existing-mapper-configuration)
      - [Delete a registered mapper](#delete-a-registered-mapper)
  - [Contribution](#contribution)
  - [License](#license)

## Getting started 🚀

### Installation

```sh
npm install --save morphism
```

### Example

```typescript
import { morphism } from 'morphism';

// Source data coming from an API.
const source = {
  foo: 'baz',
  bar: ['bar', 'foo'],
  baz: {
    qux: 'bazqux'
  }
};

// Target Class in which to morph the source data. (Optional)
class Destination {
  foo = null;
  bar = null;
  bazqux = null;
}

// A structure-preserving object from a source data towards a target data.
const schema = {
  foo: 'bar[1]', // Grab the property value by his path
  bar: (iteratee, source, destination) => {
    // Apply a Function on the current element
    return iteratee.bar[0];
  },
  bazqux: {
    // Apply a function on property value
    path: 'baz.qux',
    fn: (propertyValue, source) => {
      return propertyValue;
    }
  }
};

const classObjects = morphism(schema, source, Destination);
// Destination {foo: "foo", bar: "bar", bazqux: "bazqux"}

const jsObjects = morphism(schema, source);
// Object {foo: "foo", bar: "bar", bazqux: "bazqux"}
```

▶️ [Test with Repl.it](https://repl.it/@yrnd1/Morphism-Full-Example)

## Motivation

- Deal with multiple data contracts, like api
- Business logic to transform the source to the target spread everywhere
- Keep this business logic in one place stored as a map of transformations
- Bring a Top-Down view of your data transformation.

## Docs 🍔

You can use `morphism` in two ways:

### Morphism Mixin

### Morphism Function

## More examples 💡

### Flattening or Projection

```ts
import { morphism } from 'morphism';
// Source data coming from an API.
const source = {
  foo: 'baz',
  bar: ['bar', 'foo'],
  baz: {
    qux: 'bazqux'
  }
};
const schema = {
  foo: 'foo', // Simple Projection
  bazqux: 'baz.qux' // Grab a value from a deep path
};

morphism(schema, source);
//=> { foo: 'baz', bazqux: 'bazqux' }
```

▶️ [Test with Repl.it](https://repl.it/@yrnd1/Morphism-Flattening-Projection)

### Function over a source property's value

```ts
import { morphism } from 'morphism';
// Source data coming from an API.
const source = {
  foo: {
    bar: 'bar'
  }
};
let schema = {
  barqux: {
    path: 'foo.bar',
    fn: value => `${value}qux` // Apply a function over the source property's value
  }
};

morphism(schema, source);
//=> { barqux: 'barqux' }
```

▶️ [Test with Repl.it](https://repl.it/@yrnd1/Morphism-Function-over-a-source-propertys-value)

### Function over a source property

```ts
import { morphism } from 'morphism';
// Source data coming from an API.
const source = {
  foo: {
    bar: 'bar'
  }
};
let schema = {
  bar: iteratee => {
    // Apply a function over the source propery
    return iteratee.foo.bar;
  }
};

morphism(schema, source);
//=> { bar: 'bar' }
```

▶️ [Test with Repl.it](https://repl.it/@yrnd1/Function-over-a-source-property)

### Properties Aggregation

```ts
import { morphism } from 'morphism';
// Source data coming from an API.
const source = {
  foo: 'foo',
  bar: 'bar'
};
let schema = {
  fooAndBar: ['foo', 'bar'] // Grab these properties into fooAndBar
};

morphism(schema, source);
//=> { fooAndBar: { foo: 'foo', bar: 'bar' } }
```

▶️ [Test with Repl.it](https://repl.it/@yrnd1/Morphism-Properties-Aggregation)

### API 📚

#### Register

Register a mapper for a specific type. The schema is optional.

```js
Morphism.register(type, (schema: {}));
```

#### Map

Map a collection of objects to the specified type

```js
Morphism.map(type, (data: []));
```

#### Get or Set an existing mapper configuration

```js
Morphism.setMapper(type, (schema: {}));
```

#### Delete a registered mapper

```js
Morphism.deleteMapper(type, (schema: {}));
```

## Contribution

- Twitter: [@renaudin_yann][twitter-account]
- Pull requests and stars are always welcome 🙏🏽 For bugs and feature requests, [please create an issue](https://github.com/emyann/morphism/issues)

## License

MIT © [Yann Renaudin][twitter-account]

[twitter-account]: https://twitter.com/renaudin_yann
[npm-image]: https://badge.fury.io/js/morphism.svg?style=flat-square
[npm-url]: https://npmjs.org/package/morphism
[daviddm-image]: https://david-dm.org/emyann/morphism.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/emyann/morphism
[coveralls-image]: https://coveralls.io/repos/emyann/morphism/badge.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/emyann/morphism
