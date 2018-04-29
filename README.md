# Morphism

[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]

[![npm bundle size (minified + gzip)](https://img.shields.io/bundlephobia/minzip/morphism.svg?style=for-the-badge)](https://bundlephobia.com/result?p=morphism)

> Helps you to transform any object structure to another

## Contribution

* Twitter: [@renaudin_yann][twitter-account]
* Pull requests and stars are always welcome 🙏🏽 For bugs and feature requests, [please create an issue](https://github.com/emyann/morphism/issues)

## Getting started 🚀

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

## What does it do? 🤔

Morphism uses a semantic configuration to go through the collection of graph objects you have to process. Then it extracts and computes the value from the specified path(s). Finally, it sets this value to the destination property from the schema.

## Usage 🍔

Morphism is curried function that allows a partial application with a semantic configuration. You can use it in many ways:

### Along with an ES6 Class

```js
// Target type you want to have
class User {
    constructor(firstName, lastName, phoneNumber){
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
        this.city = null;
   }
}

// Data source you want to map
let data = [{
                'firstName': 'John',
                'lastName': 'Smith',
                'address':
                    {
                        'city': 'New York',
                        'country': 'USA'
                    },
                'phoneNumber':
                    [
                        {
                            'type': 'home',
                            'number': '212 555-1234'
                        },
                        {
                            'type': 'fax',
                            'number': '646 555-4567'
                        }
                    ]
             }];
// Mapping Schema ( see more examples below )
let schema = {
    city: 'adress.city',
    phoneNumber: (object) => object.phoneNumber.filter(c => c.type === 'home')[0].number;
}

let mapUser = Morphism.register(User, schema);

// Map using the registered type and the registry
Morphism.map(User, data)

// Or Map using the mapper reference
mapUser(data);

/// *** OUTPUT *** ///

[{
    'firstName': 'John',
    'lastName': 'Smith',
    'phoneNumber': '212 555-1234',
    'city': 'New York'
 }]
```

### As a Mapper factory

```js
let mapping = { ... }
let collectionOfObjects = [ ... ]
let anotherCollection = [ ... ]

// produces a reusable mapper from the configuration
let myAwesomeMapper = Morphism(mapping);
myAwesomeMapper(collectionOfObjects);
myAwesomeMapper(anotherCollection);
```

### As a Static instance

```js
const Morphism = require('morphism');

let mapping = { ... }
let collectionOfObjects = [ ... ]

// extracts the data straight away
let results = Morphism(mapping, collectionOfObjects);
```

## Mapping Schema Examples 💡

### Dataset sample

```js
// We'll use this set of data all along the examples
let data = [
  {
    firstName: 'John',
    lastName: 'Smith',
    address: {
      city: 'New York',
      country: 'USA'
    },
    phoneNumber: [
      {
        type: 'home',
        number: '212 555-1234'
      },
      {
        type: 'fax',
        number: '646 555-4567'
      }
    ]
  }
];
```

### Flattening and Projection

```js
let data = [ ... ];
let mapping = {
                pseudo: 'firstName', // Simple Projection
                lastName: 'lastName',
                city: 'address.city' // Flatten a value from a deep path
               };

let results = Morphism(mapping, data);

// results[0]: {
//                 pseudo: 'John',
//                 lastName: 'Smith',
//                 city: 'New York'
//             }
```

### Computing over Flattening / Projection

```js
let data = [ ... ];
let mapping = {
                pseudo: 'firstName',
                lastName: 'lastName',
                city: {
                    path: 'address.city',
                    fn: (city) => city.toLowerCase() // compute a function on the specified path value
                },
                nbContacts: (object) => object.phoneNumber.length // compute a function on the iteratee object

               };

let mapper = Morphism(mapping);
let results = mapper(data);

// results[0]): {
//                 pseudo: 'John',
//                 lastName: 'Smith',
//                 city: 'new york',// <== toLowerCase
//                 nbContacts: 2 // <== computed from the object
//              }
```

### Values Aggregation

```js
let data = [ ... ];

let mapping = {
                user: ['firstName','lastName'] // aggregate the values to an object
                city: 'address.city'
               };

let results = Morphism(mapping, data);

// results[0]: {
//                 user: {
//                     'firstName': 'John',
//                     'lastName': 'Smith'
//                 },
//                 city: 'New York'
//             }
```

### Mappers Registry 📚

Morphism provides a powerful local registry where you can store your mappings' configuration by specifying a Class Type.
The transformation sequences are stored as a function in a WeakMap to speed the processing.

**Register a mapping configuration along with a Class**

```js
class User {
  constructor(firstName, lastName, phoneNumber) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.phoneNumber = phoneNumber;
  }
}

let mapUser = Morphism.register(User, schema);

// Map using the registered type and the registry
Morphism.map(User, data);

// Or Map using the mapper reference
mapUser(data);
```

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

## License

MIT © [Yann Renaudin][twitter-account]

[twitter-account]: https://twitter.com/renaudin_yann
[npm-image]: https://badge.fury.io/js/morphism.svg
[npm-url]: https://npmjs.org/package/morphism
[travis-image]: https://travis-ci.org/emyann/morphism.svg?branch=master
[travis-url]: https://travis-ci.org/emyann/morphism
[daviddm-image]: https://david-dm.org/emyann/morphism.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/emyann/morphism
[coveralls-image]: https://coveralls.io/repos/emyann/morphism/badge.svg
[coveralls-url]: https://coveralls.io/r/emyann/morphism
