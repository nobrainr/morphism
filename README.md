# Morphism 
[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]
> Helps you to transform any object structure to another

## Communication

- Twitter: [@renaudin_yann][twitter-account]
- [GitHub Issues](https://github.com/emyann/morphism/issues)

## Installation
```sh
$ npm install --save morphism
```

## What does it do?
Morphism uses a semantic configuration to go through the collection of graph objects you have to process. Then it extracts and computes the value from the specified path(s). Finally, it sets this value to the destination property from the schema.

### Usage
Morphism is curried function that allows a partial application with a semantic configuration. You can use it in 2 ways:

#### As a Mapper factory
```js
const Morphism = require('morphism'); // (ES6 Import) import Morphism from 'morphism';

let mapping = { ... }
let collectionOfObjects = [ ... ]
let anotherCollection = [ ... ]

// produces a reusable mapper from the configuration
let myAwesomeMapper = Morphism(mapping);
myAwesomeMapper(collectionOfObjects);
myAwesomeMapper(anotherCollection);
```

#### As a Static instance
```js
const Morphism = require('morphism'); 

let mapping = { ... }
let collectionOfObjects = [ ... ]

// extracts the data straight away 
let results = Morphism(mapping, collectionOfObjects);
```
### Dataset sample
```js
// We'll use this set of data all along the examples
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
```


### Simple mapping
```js
let data = [ ... ];
let mapping = { 
                pseudo: 'firstName',
                lastName: 'lastName',
                city: 'address.city' // get a value from a deep path
               };

let results = Morphism(mapping, data);

console.log(results[0]) ==>  
        {
            pseudo: 'John',
            lastName: 'Smith',
            city: 'New York'
        }
```
### Value transformation
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

console.log(results[0]) ==>  
        {
            pseudo: 'John',
            lastName: 'Smith',
            city: 'new york',// <== toLowerCase
            nbContacts: 2 // <== computed from the object
        }
```

### Values Aggregation
```js
let data = [ ... ];

let mapping = { 
                user: ['firstName','lastName'] // aggregate the values to an object
                city: 'address.city'
               };

let results = Morphism(mapping, data);

console.log(results[0]) ==>  
        {
            user: {
                'firstName': 'John',
                'lastName': 'Smith'
            },
            city: 'New York'
        }
```

### Registry of Mappers

Morphism provides a local registry in which you can store your mappers' configuration. 

```js
class User {
    constructor(firstName, lastName, phoneNumber){
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
    }
}

let mapUser = Morphism.register(User, schema);

// Map using the registered type and the registry
Morphism.map(User, data)

// Or Map using the mapper reference
mapUser(data);
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
