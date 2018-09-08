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

---

- [Morphism](#morphism)
  - [Getting started 🚀](#getting-started-%F0%9F%9A%80)
    - [Installation](#installation)
    - [Example](#example)
  - [Motivation](#motivation)
  - [Docs 🍔](#docs-%F0%9F%8D%94)
    - [1. The Schema](#1-the-schema)
      - [Schema Example](#schema-example)
    - [2. Morphism as Currying Function](#2-morphism-as-currying-function)
      - [API](#api)
      - [Currying Function Example](#currying-function-example)
    - [3. Morphism as Mixin](#3-morphism-as-mixin)
  - [More Schema examples 💡](#more-schema-examples-%F0%9F%92%A1)
    - [Flattening or Projection](#flattening-or-projection)
    - [Function over a source property's value](#function-over-a-source-propertys-value)
    - [Function over a source property](#function-over-a-source-property)
    - [Properties Aggregation](#properties-aggregation)
  - [Registry API 📚](#registry-api-%F0%9F%93%9A)
      - [Register](#register)
      - [Map](#map)
      - [Get or Set an existing mapper configuration](#get-or-set-an-existing-mapper-configuration)
      - [Delete a registered mapper](#delete-a-registered-mapper)
      - [List registered mappers](#list-registered-mappers)
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

We live in a era where we deal with mutiple data contracts coming from several sources (Rest API, Services, Raw JSON...). When it comes to transform multiple data contracts to match with your domain objects, it's common to create your objects with `Object.assign`, `new Object(sourceProperty1, sourceProperty2)` or by simply assigning each source properties to your destination. This can leads you to have your business logic spread all over the place.

`Morphism` allows you to keep this business logic centralized and brings you a top-down view of your data transformation. When a contract change occurs, it helps to track the bug since you just need to refer to your `schema`

## Docs 🍔

📚 **[API documentation](https://morphism.now.sh)**

**`Morphism` comes with 3 artifacts to achieve your transformations:**

### 1. The Schema

A schema is an object-preserving map from one data structure to another.

The keys of the schema match the desired destination structure. Each value corresponds to an Action applied by Morphism when iterating over the input data.

You can use **4 kind of values** in your schema:

- [`ActionString`](https://morphism.now.sh/modules/morphism#actionstring): A string that allows to perform a projection from a property
- [`ActionSelector`](https://morphism.now.sh/modules/morphism#actionselector): An Object that allows to perform a function over a source property's value
- [`ActionFunction`](https://morphism.now.sh/modules/morphism#actionfunction): A Function that allows to perform a function over source property
- [`ActionAggregator`](https://morphism.now.sh/modules/morphism#actionaggregator): An Arr of String that allows to perform a function over source property

#### Schema Example

```ts
import { morphism } from 'morphism';

const input = {
  foo: {
    baz: 'value1'
  }
};

const schema = {
  bar: 'foo', // ActionString: Allows to perform a projection from a property
  qux: ['foo', 'foo.baz'], // ActionAggregator: Allows to aggregate multiple properties
  quux: (iteratee, source, destination) => {
    // ActionFunction: Allows to perform a function over source property
    return iteratee.foo;
  },
  corge: {
    // ActionSelector: Allows to perform a function over a source property's value
    path: 'foo.baz',
    fn: (propertyValue, source) => {
      return propertyValue;
    }
  }
};

morphism(schema, input);
// {
//   "bar": {
//     "baz": "value1"
//   },
//   "qux": {
//     "foo": {
//       "baz": "value1"
//     }
//   },
//   "quux": {
//     "baz": "value1"
//   },
//   "corge": "value1"
// }
```

▶️ [Test with Repl.it](https://repl.it/@yrnd1/Morphism-Schema-Options)

⏩ [More Schema examples](#more-schema-examples-%F0%9F%92%A1)

📚 [Schema Docs](https://morphism.now.sh/interfaces/morphism.schema)

### 2. Morphism as Currying Function

The simplest way to use morphism is to import the currying function:

```ts
import { morphism } from 'morphism';
```

`morphism` either outputs a mapping function or the transformed data depending on the usage:

#### API

```ts
morphism(schema: Schema, items?: any, type?: any): any
```

📚 [Currying Function Docs](https://morphism.now.sh/modules/morphism#morphism-1)

#### Currying Function Example

```ts
// Outputs a function when only a schema is provided
const fn = morphism(schema);
const result = fn(data);

// Outputs the transformed data when a schema and the source data are provided
const result = morphism(schema, data);

// Outputs the transformed data as an ES6 Class Object when a schema, the source data and an ES6 Class are provided
const result = morphism(schema, data, Foo);
// => Items in result are instance of Foo
```

### 3. Morphism as Mixin

Morphism comes along with an internal registry you can use to save your schema attached to a specific **ES6 Class**.

In order to use the registry, you might want to use the default export:

```ts
import Morphism from 'morphism';
```

All features available with the currying function are also available when using the mixin plus the internal registry:

```typescript
// Currying Function
Morphism(schema: Schema, items?: any, type?: any): any

// Registry API
Morphism.register(type: any, schema?: Schema);
Morphism.map(type: any, data?: any);
Morphism.setMapper(type: any, schema: Schema);
Morphism.getMapper(type);
Morphism.deleteMapper(type);
Morphism.mappers
```

🔗 [Registry API Documentation](#registry-api-%F0%9F%93%9A)

## More Schema examples 💡

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

## Registry API 📚

📚 [Registry API Documentation](https://morphism.now.sh/classes/morphism.morphismregistry.html)

#### Register

Register a mapper for a specific type. The schema is optional.

```js
Morphism.register(type: any, schema?: Schema);
```

#### Map

Map a collection of objects to the specified type

```ts
Morphism.map(type: any, data?: any);
```

#### Get or Set an existing mapper configuration

```ts
Morphism.setMapper(type: any, schema: Schema);
Morphism.getMapper(type);
```

#### Delete a registered mapper

```js
Morphism.deleteMapper(type);
```

#### List registered mappers

```js
Morphism.mappers;
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
