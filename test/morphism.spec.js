import expect from 'expect';
import Morphism from '../lib/morphism';

describe('morphism', function () {

    beforeEach(function () {
        this.dataToCrunch = [{
            'firstName': 'John',
            'lastName': 'Smith',
            'age': 25,
            'address':
            {
                'streetAddress': '21 2nd Street',
                'city': 'New York',
                'state': 'NY',
                'postalCode': '10021'
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
    });

    describe('Structural', function () {
        it('should export Morphism function curried function', function () {
            expect(Morphism).toBeA('function');
        });

        it('should provide a mapper function from the partial application', function () {
            let fn = Morphism({});
            expect(fn).toBeA('function');
        });

        it('should provide an array of results when Morphism applied on array of data', function () {
            expect(Morphism({}, this.dataToCrunch)).toBeA('object');
        });


    });

    describe('Mapper Instance', function () {
        it('should provide a pure idempotent mapper function from the partial application', function () {
            let schema = {
                user: ['firstName', 'lastName'],
                city: 'address.city'
            };
            let desiredResult = {
                user: {
                    firstName: 'John',
                    lastName: 'Smith'
                },
                city: 'New York'
            };
            let mapper = Morphism(schema);
            let results = mapper(this.dataToCrunch);
            expect(results[0]).toEqual(desiredResult);
            expect(results[0]).toEqual(mapper(this.dataToCrunch)[0]);

        });
    });

    describe('Paths Aggregation', function () {
        it('should return a object of aggregated values given a array of paths', function () {
            let schema = {
                user: ['firstName', 'lastName']
            };

            let desiredResult = {
                user: {
                    firstName: 'John',
                    lastName: 'Smith'
                }
            };
            let results = Morphism(schema, this.dataToCrunch);
            expect(results[0]).toEqual(desiredResult);
        });
    });

    describe('Flat projection', function () {

        it('should flatten data from specified path', function () {
            let schema = {
                firstName: 'firstName',
                lastName: 'lastName',
                city: 'address.city'
            };

            let desiredResult = {
                firstName: 'John',
                lastName: 'Smith',
                city: 'New York'
            };
            let results = Morphism(schema, this.dataToCrunch);
            expect(results[0]).toEqual(desiredResult);
        });

        it('should compute function on data from specified path', function () {
            let schema = {
                state: {
                    path: 'address.state',
                    fn: (s) => s.toLowerCase()
                }
            };

            let desiredResult = {
                state: 'ny' // from NY to ny
            };
            let results = Morphism(schema, this.dataToCrunch);
            expect(results[0]).toEqual(desiredResult);
        });

        it('should pass the object value to the function when no path is specified', function () {
            let schema = {
                firstName: 'firstName',
                lastName: 'lastName',
                city: 'address.city',
                status: (o) => o.phoneNumber[0].type
            };

            let desiredResult = {
                firstName: 'John',
                lastName: 'Smith',
                city: 'New York',
                status: 'home'
            };
            let results = Morphism(schema, this.dataToCrunch);
            expect(results[0]).toEqual(desiredResult);
        });
    });
});
