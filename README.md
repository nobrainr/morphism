[twitter-account]: https://twitter.com/renaudin_yann
[npm-image]: https://badge.fury.io/js/morphism.svg
[npm-url]: https://npmjs.org/package/morphism
[travis-image]: https://travis-ci.org/emyann/morphism.svg?branch=master
[travis-url]: https://travis-ci.org/emyann/morphism
[daviddm-image]: https://david-dm.org/emyann/morphism.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/emyann/morphism
[coveralls-image]: https://coveralls.io/repos/emyann/morphism/badge.svg
[coveralls-url]: https://coveralls.io/r/emyann/morphism

# Morphism

[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]
> Mapper for JavaScript Object Literals, and ES6 Class Objects. Scale your data processing. 🚀

## Contribution 

- Twitter: [@renaudin_yann][twitter-account]
- Pull requests and stars are always welcome 🙏🏽 For bugs, feature requests and questions, [please create an issue](https://github.com/emyann/morphism/issues)

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

If you're using [browserify](http://browserify.org/), the `morphism` npm module
also works from the browser.

### What is Morphism? 🤔
Morphism maps any Javascript Object into another. It works by transforming an input object of one type into an output object of a different type. What makes Morphism interesting is that it provides some interesting conventions to take the dirty work out of figuring out how to map an Object A to an Object|Type B. As long as type B follows Morphism's established convention, almost zero configuration is needed to map two types.

Morphism uses a configuration object schema to go through the collection of graph objects you have to process. Then it extracts and computes the value from the specified path(s). Finally, it sets this value to the destination property from the schema.

### Why use Morphism? 
Mapping code is boring and it can occur in many places in an application, but mostly in the boundaries between layers, such as between the UI/Domain layers, or Service/Domain layers. Concerns of one layer often conflict with concerns in another, so object-object mapping leads to segregated models, where concerns for each layer can affect only types in that layer.

### How do I use Morphism? 🍔
Morphism is a curried function
Morphism will map null values.
Morphism will fallback to constructor property value when source is undefined.

## Object Literals
### Flattening

### Projection

### Aggregation

### Collection of Objects

### Single Object

## ES6 Class Objects
### Factory

### Registry

Morphism provides a powerful local registry where you can store your mappings' configuration by specifying a Class Type.
The transformation sequences are stored as a function in a WeakMap to speed the processing.

### Nested Mappings

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



## License
MIT © [Yann Renaudin][twitter-account]
