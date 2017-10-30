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

    describe('Plain Objects', function () {
        it('should export Morphism function curried function', function () {
            expect(Morphism).toBeA('function');
        });

        it('should provide a mapper function from the partial application', function () {
            let fn = Morphism({});
            expect(fn).toBeA('function');
        });

        it('should provide an array of results when Morphism applied on array of data', function () {
            expect(Morphism({}, [])).toBeAn('array');
            expect(Morphism({}, [])).toEqual([]);
        });

        it('should provide an Object as result when Morphism is applied on an Object', function () {
            expect(Morphism({}, [])).toBeAn('object');
            expect(Morphism({}, {})).toEqual({});
        });

        it('should throw an exception when setting a mapper with a falsy schema', function () {
            expect(() => { Morphism.setMapper(User, null); }).toThrow();
        });

        it('should throw an exception when trying to access a path from an undefined object', function () {
            Morphism.setMapper(User, {
                fieldWillThrow: {
                    path: 'fieldWillThrow.becauseNotReachable',
                    fn: (object) => {
                        let failHere = object.value;
                        return failHere;
                    }
                }
            });
            let applyMapping = () => Morphism.map(User, {
                fieldWillThrow : 'value'
            });
            expect(applyMapping).toThrow();
        });

        it('should rethrow an exception when applying a function on path throws an error', function () {
            const err = new TypeError('an internal error');
            Morphism.setMapper(User, {
                fieldWillThrow: {
                    path: 'fieldWillThrow',
                    fn: () => {
                        throw err;
                    }
                }
            });
            let applyMapping = () => Morphism.map(User, {
                fieldWillThrow : 'value'
            });
            expect(applyMapping).toThrow(TypeError);
        });

        it('should allow to use a mapper as an iteratee first function', function () {
            let mocks = [
                {source: 'value'},
                {source: 'value'},
                {source: 'value'}
            ];
            let schema={
                target:'source'
            };
            const mapper = Morphism(schema);
            let results = mocks.map(mapper);
            results.forEach(res => {
                expect(res).toEqual({target: 'value'});
            });
        });

        it('should allow to use a mapper declaration as an iteratee first function', function () {
            let mocks = [
                {source: 'value'},
                {source: 'value'},
                {source: 'value'}
            ];
            let schema={
                target:'source'
            };

            let results = mocks.map(Morphism(schema));
            results.forEach(res => {
                expect(res).toEqual({target: 'value'});
            });
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

    describe('Schema', function () {
        describe('Function Predicate', function () {
            it('should support es6 destructuring as function predicate', function () {
                let schema = {
                    target: ({source}) => source
                };
                let mock = {
                    source: 'value'
                };
                let expected = {
                    target: 'value'
                };
                let result = Morphism(schema, mock);
                expect(result).toEqual(expected);
            });

            it('should support nesting mapping', function () {
                let nestedSchema = {
                    target1: 'source',
                    target2: ({nestedSource}) => nestedSource.source
                };
                let schema = {
                    complexTarget: ({complexSource}) => Morphism(nestedSchema, complexSource)
                };
                let mock = {
                    complexSource: {
                        source: 'value1',
                        nestedSource: {
                            source: 'value2'
                        }
                    }
                };
                let expected = {
                    complexTarget: {
                        target1: 'value1',
                        target2: 'value2'
                    }
                };
                let result = Morphism(schema, mock);
                expect(result).toEqual(expected);
            });

            it('should be resilient when doing nesting mapping and using destructuration on array', function () {
                let nestedSchema = {
                    target: 'source',
                    nestedTargets: ({ nestedSources }) => Morphism(
                        { nestedTarget: ({ nestedSource }) => nestedSource },
                        nestedSources)
                };
                let schema = {
                    complexTarget: ({complexSource}) => Morphism(nestedSchema, complexSource)
                };
                let mock = {
                    complexSource: {
                        source: 'value1',
                        nestedSources: []
                    }
                };
                let expected = {
                    complexTarget: {
                        target: 'value1',
                        nestedTargets: []
                    }
                };
                let result = Morphism(schema, mock);
                expect(result).toEqual(expected);

            });
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

        it('should return a object of aggregated values given a array of paths (nested path case)', function () {
            let schema = {
                user: ['firstName', 'address.city']
            };

            let desiredResult = {
                user: {
                    firstName: 'John',
                    address: {
                        city: 'New York'
                    }
                }
            };
            let results = Morphism(schema, this.dataToCrunch);
            expect(results[0]).toEqual(desiredResult);
        });


        it('should provide an aggregate as a result from an array of paths when applying a function',()=>{
            let data = {a:1 , b: { c: 2 }};
            let rules = {
                ac: {
                    path: ['a','b.c'],
                    fn: aggregate => {
                        expect(aggregate).toEqual({ a:1, b:{ c:2 } });
                        return aggregate;
                    }
                }
            };
            let res = Morphism(rules, data);

            expect(res).toEqual({ac: { a:1, b:{ c:2 } }});
        });
    });

    describe('Flattening and Projection', function () {

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

        it('should use the constructor default value if source value is undefined', function () {
            let sourceData = {
                firstName: 'John',
                lastName: 'Smith',
                type: undefined // <== this field should fallback to the type constructor default value
            };
            let desiredResult = new User('John', 'Smith');
            let mapper = Morphism.register(User);
            expect(desiredResult.type).toEqual('User');
            expect(mapper([sourceData])[0]).toEqual(desiredResult);
        });

        it('should allow straight mapping from a Type without a schema', () => {
            let userName = 'user-name';
            let user = Morphism(null,{firstName: userName}, User);
            expect(user).toEqual(new User(userName));
        });

        it('should allow straight mapping from a Type with a schema', () => {
            let dataSource = {
                userName: 'a-user-name'
            };
            let schema = {
                firstName : 'userName'
            }
            let user = Morphism(schema, dataSource, User);
            expect(user).toEqual(new User(dataSource.userName));
        });


        it('should return undefined if undefined is given to map without doing any processing', function () {
            Morphism.register(User, { a: 'firstName'});
            expect(Morphism.map(User, undefined)).toEqual(undefined);
        });

        it('should override the default value if source value is defined', function () {
            let sourceData = {
                phoneNumber: null
            };

            let mapper = Morphism.register(User, {});
            let result = mapper([sourceData])[0];
            expect((new User()).phoneNumber).toEqual(undefined);
            expect(result.phoneNumber).toEqual(null);
        });

        it('should provide an Object as result when Morphism is applied on a typed Object', function () {
            let mock = {
                number: '12345'
            };

            let mapper = Morphism.register(User, { phoneNumber: 'number' });
            let result = mapper(mock);
            expect(result.phoneNumber).toEqual(mock.number);
            expect(result).toBeA(User);
        });

        it('should provide an Object as result when Morphism is applied on a typed Object usin .map', function () {
            let mock = {
                number: '12345'
            };

            Morphism.register(User, { phoneNumber: 'number' });
            let result = Morphism.map(User, mock);
            expect(result.phoneNumber).toEqual(mock.number);
            expect(result).toBeA(User);
        });

        it('should provide a List of Objects as result when Morphism is applied on a list', function () {
            let mock = {
                number: '12345'
            };

            Morphism.register(User, { phoneNumber: 'number' });
            let result = Morphism.map(User, [mock]);
            expect(result[0].phoneNumber).toEqual(mock.number);
            expect(result[0]).toBeA(User);
        });

        it('should fallback to constructor default value and ignore function when path value is undefined', function () {
            let mock = {
                lastname: 'user-lastname'
            };
            let schema = {
                type : {
                    path: 'unreachable.path',
                    fn: (value) => value
                }
            };

            Morphism.register(User, schema);
            expect((new User()).type).toEqual('User');

            let result = Morphism.map(User, mock);
            expect(result.type).toEqual('User');
        });

        describe('Projection', () => {
            it('should allow to map property one to one when using `Morphism.map(Type,object)` without registration', function () {
                let mock =  {field: 'value'};
                class Target {
                    constructor(field){
                        this.field = field;
                    }
                }
                const result = Morphism.map(Target, mock);
                expect(result).toEqual(new Target('value'));
            });

            it('should allow to map property one to one when using `Morphism.map(Type,data)` without registration', function () {
                let mocks = [
                    {field: 'value'},
                    {field: 'value'},
                    {field: 'value'}
                ];
                class Target {
                    constructor(field){
                        this.field = field;
                    }
                }
                const results = Morphism.map(Target, mocks);
                results.forEach(res => {
                    expect(res).toEqual(new Target('value'));
                });
            });

            it('should allow to use Morphism.map as an iteratee first function', function () {
                let mocks = [
                    {field: 'value'},
                    {field: 'value'},
                    {field: 'value'}
                ];
                class Target {
                    constructor(field){
                        this.field = field;
                    }
                }
                const results = mocks.map(Morphism.map(Target));
                results.forEach(res => {
                    expect(res).toEqual(new Target('value'));
                });
            });

            it('should allow to use mapper from `Morphism.map(Type, undefined)` as an iteratee first function', function () {
                let mocks = [
                    {field: 'value'},
                    {field: 'value'},
                    {field: 'value'}
                ];
                class Target {
                    constructor(field){
                        this.field = field;
                    }
                }
                const mapper = Morphism.map(Target);
                const results = mocks.map(mapper);
                results.forEach(res => {
                    expect(res).toEqual(new Target('value'));
                });
            });
        });
    });
});
