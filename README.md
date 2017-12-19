# Morphism

[twitter-account]: https://twitter.com/renaudin_yann
[npm-image]: https://badge.fury.io/js/morphism.svg
[npm-url]: https://npmjs.org/package/morphism
[travis-image]: https://travis-ci.org/emyann/morphism.svg?branch=master
[travis-url]: https://travis-ci.org/emyann/morphism
[daviddm-image]: https://david-dm.org/emyann/morphism.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/emyann/morphism
[coveralls-image]: https://coveralls.io/repos/emyann/morphism/badge.svg
[coveralls-url]: https://coveralls.io/r/emyann/morphism

[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]
> Mapper for JavaScript Object Literals, and ES6 Class Objects. Scale your data processing. 🚀

## Getting Started 🚀

Install `morphism` using npm.

```sh
npm install --save morphism
```

Then require it into any module.

```js
const Morphism = require('morphism');
```

Or using ES6 import style

```js
import Morphism from 'morphism';
```

<details>
<summary> What is Morphism? 👥 </summary>

> In many fields of mathematics, **morphism** refers to a structure-preserving map from one mathematical structure to another.

Morphism maps any Javascript Object into another. It works by transforming an input object of one type into an output object of a different type. What makes Morphism interesting is that it provides some interesting conventions to take the dirty work out of figuring out how to map an Object A to an Object|Type B. But you'll still have the control over the way how your business logic is applied during those transformations.
</details>

 <!-- ### What is Morphism? 👥  -->



### How do I use Morphism? 🍔

Morphism is a curried function
Morphism will map null values.
Morphism will fallback to constructor property value when source is undefined.

Morphism uses a configuration object schema to go through the collection of graph objects you have to process. Then it extracts and computes the value from the specified path(s). Finally, it sets this value to the destination property from the schema.

### Why use Morphism? 🤔

Mapping code is boring and it can occur in many places in an application, but mostly in the boundaries between layers, such as between the UI/Domain layers, or Service/Domain layers. Concerns of one layer often conflict with concerns in another, so object-object mapping leads to segregated models, where concerns for each layer can affect only types in that layer.

When you're consuming an API, it's always dangerous to have `new Object()` statements spread all over the place. Morphism helps you transform on-the-fly  your JSON responses into your Domain Model Objects. It can also act as Factory by providing a local registry to store a mapping along with a Class Type.

---

## Data Transformation

### Input/Ouput Dimension

By design, the output result always match the dimension of the input data source.

```js
expect(Morphism(schema, [])).toEqual([]);
expect(Morphism(schema, {})).toEqual({});
```

### Flattening

### Projection

### Aggregation

### Nested Mappings

## ES6 Class Objects

### Factory

### Registry

Morphism provides a local registry to store a mapping along with a Class Type.


### Configuration


### API 📚

#### Register

Register a mapper for a specific type. The schema is optional.

```js
Morphism.register(type, schema:{});
```

#### Map

Map a collection of objects to the specified type

```js
Morphism.map(type, data:[]);
```

#### Get or Set an existing mapper configuration

```js
Morphism.setMapper(type, schema:{});
```

#### Delete a registered mapper

```js
Morphism.deleteMapper(type, schema:{});
```

## Contributing

- Pull requests and stars are always welcome 🙏🏽 For bugs, feature requests and questions, [please create an issue](https://github.com/emyann/morphism/issues)

## License

MIT © [Yann Renaudin][twitter-account]
