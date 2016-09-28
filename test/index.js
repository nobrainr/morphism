import expect from 'expect';
import { Morphism } from '../lib';

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

    describe('structural', function () {
        it('should export Morphism function curried function', function () {
            expect(Morphism).toBeA('function');
        });

        it('should provide a function when map configuration only is given', function () {
            let fn = Morphism({});
            expect(fn).toBeA('function');
        });

        it('should provide an array of results when Morphism applied on array of data', function () {
            expect(Morphism({}, this.dataToCrunch)).toBeA('object');
        });
    });

    describe('flat projection', function () {

        beforeEach(function () {

        });

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

        it('should set the value as default when anonymous function is provided', function () {
            let schema = {
                status: () => 'morphism-ed'
            };

            let desiredResult = {
                status: 'morphism-ed'
            };
            let results = Morphism(schema, this.dataToCrunch);
            expect(results[0]).toEqual(desiredResult);
        });
    });
});
