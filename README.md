# morphism [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]
> Helps you to transform any object structure to another

## Installation

```sh
$ npm install --save morphism
```

## Usage

```js
var morphism = require('morphism');

let dataToCrunch = [{
            'firstName': 'John',
            'lastName': 'Smith',
            'age': 25,
            'address':
            {
                'city': 'New York',
                'state': 'NY',
                'postalCode': '10021'
            }
        }];

let schema = { 
                pseudo: 'firstName',
                lastName: 'lastName',
                city: 'address.city'
                state: {
                    path: 'address.state',
                    fn: (state) => state.toLowerCase()
                },
                status: () => 'morphed'
            };

let results = Morphism(schema, dataToCrunch);
/** results[0]
    {
        pseudo: 'John',
        lastName: 'Smith',
        city: 'New York',
        state:'ny',
        status: 'morphed'
    }
*/
```
## License

MIT © [Yann Renaudin]()


[npm-image]: https://badge.fury.io/js/morphism.svg
[npm-url]: https://npmjs.org/package/morphism
[travis-image]: https://travis-ci.org/emyann/morphism.svg?branch=master
[travis-url]: https://travis-ci.org/emyann/morphism
[daviddm-image]: https://david-dm.org/emyann/morphism.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/emyann/morphism
[coveralls-image]: https://coveralls.io/repos/emyann/morphism/badge.svg
[coveralls-url]: https://coveralls.io/r/emyann/morphism
