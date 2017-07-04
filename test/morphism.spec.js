import expect from 'expect';
import Morphism from '../lib/morphism';
import { User } from './models.mocks';

describe('Morphism', function () {

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
        Morphism.deleteMapper(User);
        this.mapUser = Morphism.register(User);
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

        it('should throw an exception when setting a mapper with a falsy schema', function () {
            expect(() => { Morphism.setMapper(User, null); }).toThrow();
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

    describe('Mappers Registry', function () {

        it('should throw an exception when using Registration function without parameters', function () {
            expect(Morphism.register).toThrow(Error);
        });

        it('should throw an exception when trying to register a mapper type more than once', function () {
            expect(() => { Morphism.register(User, {}); }).toThrow(Error);
        });

        it('should return the stored mapper after a registration', function () {
            let schema = {
                phoneNumber: 'phoneNumber[0].number'
            };
            let mapper = Morphism.setMapper(User, schema);
            expect(mapper).toBeA('function');
            expect(this.mapUser).toEqual(mapper);
        });

        it('should get a stored mapper after a registration', function () {
            Morphism.setMapper(User, {});
            expect(Morphism.getMapper(User)).toBeA('function');
        });

        it('should allow to map data using a registered mapper', function () {
            let schema = {
                phoneNumber: 'phoneNumber[0].number'
            };
            Morphism.setMapper(User, schema);
            let desiredResult = new User('John', 'Smith', '212 555-1234');
            expect(Morphism.map(User, this.dataToCrunch)).toExist();
            expect(Morphism.map(User, this.dataToCrunch)[0]).toEqual(desiredResult);
        });

        it('should allow to map data using a mapper updated schema', function () {
            let schema = {
                phoneNumber: 'phoneNumber[0].number'
            };
            let mapper = Morphism.setMapper(User, schema);
            let desiredResult = new User('John', 'Smith', '212 555-1234');
            expect(mapper(this.dataToCrunch)[0]).toEqual(desiredResult);
        });

        it('should throw an exception when trying to set an non-registered type', function () {
            Morphism.deleteMapper(User);
            expect(() => { Morphism.setMapper(User, {}); }).toThrow();
        });
    });

    describe('Class Type Mapping', function () {

        beforeEach(()=>{
            Morphism.deleteMapper(User);
        });

        it('should use the constructor default value if source does not have field to map', function () {
            let phoneNumber = [
                {
                    type: 'home',
                    number: '212 555-1234'
                },
                {
                    type: 'fax',
                    number: '646 555-4567'
                }
            ];
            let desiredResult = new User('John', 'Smith', phoneNumber);

            let mapper = Morphism.register(User, {});
            expect(mapper(this.dataToCrunch)[0]).toEqual(desiredResult);
        });

    });
});

