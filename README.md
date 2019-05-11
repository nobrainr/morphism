# Morphism

<!-- <div style="text-align:center">
<img src="https://i.imgur.com/4muW6u2.jpg" width="800px">
</div> -->

[![npm](https://img.shields.io/npm/v/morphism.svg?style=for-the-badge)][npm-url]
[![npm bundle size (minified)](https://img.shields.io/bundlephobia/min/morphism.svg?style=for-the-badge)](https://github.com/nobrainr/morphism)
[![npm](https://img.shields.io/npm/dy/morphism.svg?style=for-the-badge)][trends-url]
[![Coveralls github](https://img.shields.io/coveralls/github/emyann/morphism.svg?style=for-the-badge)][coveralls-url]
[![CircleCI (all branches)](https://img.shields.io/circleci/project/github/nobrainr/morphism/master.svg?style=for-the-badge)][circleci-url]
[![Deps](https://img.shields.io/david/nobrainr/morphism.svg?style=for-the-badge)][deps-url]
[![Greenkeeper badge](https://badges.greenkeeper.io/nobrainr/morphism.svg)](https://greenkeeper.io/)

> In many fields of mathematics, morphism refers to a structure-preserving map from one mathematical structure to another. A morphism **f** with source **X** and target **Y** is written **f : X → Y**. Thus a morphism is represented by an arrow from its **source** to its **target**.

_https://en.wikipedia.org/wiki/Morphism_

- ⚛️ Write your schema once, Transform your data everywhere
- 0️⃣ Zero dependencies
- 💪🏽 Typescript Support

---

- [Morphism](#morphism)
  - [Getting started](#getting-started)
    - [Installation](#installation)
    - [Usage](#usage)
    - [Example (TypeScript)](#example-typescript)
  - [Motivation](#motivation)
  - [TypeScript integration](#typescript-integration)
  - [Docs](#docs)
    - [1. The Schema](#1-the-schema)
      - [Schema actions](#schema-actions)
      - [Schema Example](#schema-example)
      - [1.1 Using a strict Schema](#11-using-a-strict-schema)
    - [2. Morphism as Currying Function](#2-morphism-as-currying-function)
      - [API](#api)
      - [Currying Function Example](#currying-function-example)
    - [3. Morphism Function as Decorators](#3-morphism-function-as-decorators)
      - [`toJsObject` Decorator](#tojsobject-decorator)
      - [`toClassObject` Decorator](#toclassobject-decorator)
      - [`morph` Decorator](#morph-decorator)
    - [4. Default export: Morphism object](#4-default-export-morphism-object)
  - [More Schema examples](#more-schema-examples)
    - [Flattening or Projection](#flattening-or-projection)
    - [Function over a source property's value](#function-over-a-source-propertys-value)
    - [Function over a source property](#function-over-a-source-property)
    - [Properties Aggregation](#properties-aggregation)
  - [Registry API](#registry-api)
      - [Register](#register)
      - [Map](#map)
      - [Get or Set an existing mapper configuration](#get-or-set-an-existing-mapper-configuration)
      - [Delete a registered mapper](#delete-a-registered-mapper)
      - [List registered mappers](#list-registered-mappers)
  - [Contribution](#contribution)
  - [Similar Projects](#similar-projects)
  - [License](#license)

## Getting started

### Installation

```sh
npm install --save morphism
```

or in the browser

```html
<script src="https://unpkg.com/morphism/dist/morphism.js"></script>
<script>
  const { morphism, createSchema } = Morphism
</script>
```

### Usage

The entry point of a **morphism** is the **schema**. The `keys` represent the shape of your **target** object, and the `values` represents one of the several ways to access the properties of the incoming source.

```typescript
const schema = {
  targetProperty: 'sourceProperty'
};
```
Then use the `morphism` function along with the **schema** to transform any **source** to your desired **target**


```typescript
import { morphism } from 'morphism';

const source = {
  _firstName: 'Mirza'
};

const schema = {
  name: '_firstName'
};

morphism(schema, source);
➡
{
  "name": "Mirza"
}
```

You may specify properties deep within the source object to be copied to your desired target by using dot notation in the mapping `value`. 
This is [one of the actions available](#schema-actions) to transform the source data

```typescript
const schema = {
  foo: 'deep.foo',
  bar: {
	baz: 'deep.foo'
  }
};

const source = {
  deep: {
	foo: 'value'
  }
};

morphism(schema, source);
➡
{
  "foo": "value",
  "bar": {
    "baz": "value"
  }
}
```

One important rule of `Morphism` is that **it will always return a result respecting the dimension of the source data.** If the source data is an `array`, morphism will outputs an `array`, if the source data is an `object` you'll have an `object`

```typescript
const schema = {
  foo: 'bar'
};

// The source is a single object
const object = {
  bar: 'value'
};

morphism(schema, object);
➡
{
  "foo": "value"
}

// The source is a collection of objects
const multipleObjects = [{
  bar: 'value'
}];

morphism(schema, multipleObjects);
➡
[{
  "foo": "value"
}]
```

### Example (TypeScript)

```typescript
import { morphism, StrictSchema } from 'morphism';

// What we have
interface Source {
  ugly_field: string;
}

// What we want
interface Destination {
  field: string;
}

const source: Source = {
  ugly_field: 'field value'
};

// Destination and Source types are optional
morphism<StrictSchema<Destination, Source>>({ field: 'ugly_field' }, source);
// => {field: "field value"}

// Or
const sources = [source];
const schema: StrictSchema<Destination, Source> = { field: 'ugly_field' };
morphism(schema, sources);
// => [{field: "field value"}]
```

▶️ [Test with Repl.it](https://repl.it/@yrnd1/Morphism-Full-Example)

## Motivation

We live in a era where we deal with mutiple data contracts coming from several sources (Rest API, Services, Raw JSON...). When it comes to transform multiple data contracts to match with your domain objects, it's common to create your objects with `Object.assign`, `new Object(sourceProperty1, sourceProperty2)` or by simply assigning each source properties to your destination. This can leads you to have your business logic spread all over the place.

`Morphism` allows you to keep this business logic centralized and brings you a top-down view of your data transformation. When a contract change occurs, it helps to track the bug since you just need to refer to your `schema`

## TypeScript integration

When you type your schema, this library will require you to specify each transformation for your required fields.

![schema](https://raw.githubusercontent.com/nobrainr/morphism/master/images/schema.png)

![schema-required-fields](https://raw.githubusercontent.com/nobrainr/morphism/master/images/schema-required-fields.png)


This library uses TypeScript extensively. The target type will be inferred from the defined schema.

![inferred field type](https://raw.githubusercontent.com/nobrainr/morphism/master/images/inferred-field-type.png)

When using an [`ActionFunction`](https://morphism.now.sh/modules/morphism#actionfunction) the input type is also inferred to enforce your transformations

![typed action function](https://raw.githubusercontent.com/nobrainr/morphism/master/images/ts-action-function.png)

See below the different options you have for the schema.

## Docs

📚 **[API documentation](https://morphism.now.sh)**

**`Morphism` comes with 3 artifacts to achieve your transformations:**

### 1. The Schema

A schema is an object-preserving map from one data structure to another.

The keys of the schema match the desired destination structure. Each value corresponds to an Action applied by Morphism when iterating over the input data.

#### Schema actions

You can use **4 kind of values** for the keys of your schema:

- [`ActionString`](https://morphism.now.sh/modules/_types_#actionstring): A string that allows to perform a projection from a property
- [`ActionSelector`](https://morphism.now.sh/interfaces/_types_.actionselector): An Object that allows to perform a function over a source property's value
- [`ActionFunction`](https://morphism.now.sh/interfaces/_types_.actionfunction): A Function that allows to perform a function over source property
- [`ActionAggregator`](https://morphism.now.sh/modules/_types_#actionaggregator): An Array of Strings that allows to perform a function over source property

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

#### 1.1 Using a strict Schema

You might want to enforce the keys provided in your schema using `Typescript`. This is possible using a `StrictSchema`. Doing so will require to map every field of the `Target` type provided.

```ts
interface IFoo {
  foo: string;
  bar: number;
}
const schema: StrictSchema<IFoo> = { foo: 'qux', bar: () => 'test' };
const source = { qux: 'foo' };
const target = morphism(schema, source);
// {
//   "foo": "qux",
//   "bar": "test"
// }
```

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

### 3. Morphism Function as Decorators

You can also use Function Decorators on your method or functions to transform the return value using `Morphism`:

#### `toJsObject` Decorator

```ts
import { toJSObject } from 'morphism';

class Service {
  @toJSObject({
    foo: currentItem => currentItem.foo,
    baz: 'bar.baz'
  })
  async fetch() {
    const response = await fetch('https://api.com');
    return response.json();
    // =>
    // {
    //   foo: 'fooValue'
    //   bar: {
    //     baz: 'bazValue'
    //   }
    // };
  }
}

// await service.fetch() will return
// =>
// {
//   foo: 'fooValue',
//   baz: 'bazValue'
// }

--------------------------------

// Using Typescript will enforce the key from the target to be required
class Target {
  a: string = null;
  b: string = null;
}
class Service {
  // By Using <Target>, Mapping for Properties `a` and `b` will be required
  @toJSObject<Target>({
    a: currentItem => currentItem.foo,
    b: 'bar.baz'
  })
  fetch();
}
```

#### `toClassObject` Decorator

```ts
import { toClassObject } from 'morphism';

class Target {
  foo = null;
  bar = null;
}
const schema = {
  foo: currentItem => currentItem.foo,
  baz: 'bar.baz'
};
class Service {
  @toClassObject(schema, Target)
  async fetch() {
    const response = await fetch('https://api.com');
    return response.json();
    // =>
    // {
    //   foo: 'fooValue'
    //   bar: {
    //     baz: 'bazValue'
    //   }
    // };
  }
}

// await service.fetch() will be instanceof Target
// =>
// Target {
//   foo: 'fooValue',
//   baz: 'bazValue'
// }
```

#### `morph` Decorator

Utility decorator wrapping `toClassObject` and `toJSObject` decorators

```ts
import { toClassObject } from 'morphism';

class Target {
  foo = null;
  bar = null;
}
const schema = {
  foo: currentItem => currentItem.foo,
  baz: 'bar.baz'
};
class Service {
  @morph(schema)
  async fetch() {
    const response = await fetch('https://api.com');
    return response.json();
    // =>
    // {
    //   foo: 'fooValue'
    //   bar: {
    //     baz: 'bazValue'
    //   }
    // };
  }
  @morph(schema, Target)
  async fetch2() {
    const response = await fetch('https://api.com');
    return response.json();
  }
}
// await service.fetch() will be
// =>
// {
//   foo: 'fooValue',
//   baz: 'bazValue'
// }

// await service.fetch() will be instanceof Target
// =>
// Target {
//   foo: 'fooValue',
//   baz: 'bazValue'
// }
```

### 4. Default export: Morphism object

Morphism comes along with an internal registry you can use to save your schema attached to a specific **ES6 Class**.

In order to use the registry, you might want to use the default export:

```ts
import Morphism from 'morphism';
```

All features available with the currying function are also available when using the plain object plus the internal registry:

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

🔗 [Registry API Documentation](#registry-api)

## More Schema examples

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

## Registry API

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

## Similar Projects

- [`object-mapper`](https://www.npmjs.com/package/object-mapper)
- [`autoMapper-ts`](https://www.npmjs.com/package/automapper-ts)
- [`C# AutoMapper`](https://github.com/AutoMapper/AutoMapper)
- [`node-data-transform`](https://github.com/bozzltron/node-json-transform)

## License

MIT © [Yann Renaudin][twitter-account]

[twitter-account]: https://twitter.com/YannRenaudin
[npm-image]: https://badge.fury.io/js/morphism.svg?style=flat-square
[npm-url]: https://npmjs.org/package/morphism
[deps-url]: https://www.npmjs.com/package/morphism?activeTab=dependencies
[coveralls-image]: https://coveralls.io/repos/emyann/morphism/badge.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/emyann/morphism
[circleci-url]: https://circleci.com/gh/nobrainr/morphism
[trends-url]: https://www.npmtrends.com/morphism
