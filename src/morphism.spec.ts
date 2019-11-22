import Morphism, {
  StrictSchema,
  morphism,
  Schema,
  createSchema,
  SchemaOptions,
  SCHEMA_OPTIONS_SYMBOL,
  reporter,
  Validation,
} from './morphism';
import { User, MockData } from './utils-test';
import { ActionSelector, ActionAggregator } from './types';
import { defaultFormatter, ValidationError } from './validation/reporter';
import { ValidatorError } from './validation/validators/ValidatorError';

describe('Morphism', () => {
  const dataToCrunch: MockData[] = [
    {
      firstName: 'John',
      lastName: 'Smith',
      age: 25,
      address: {
        streetAddress: '21 2nd Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10021',
      },
      phoneNumber: [
        {
          type: 'home',
          number: '212 555-1234',
        },
        {
          type: 'fax',
          number: '646 555-4567',
        },
      ],
    },
  ];
  beforeEach(() => {
    Morphism.deleteMapper(User);
    Morphism.register(User);
  });

  describe('Currying Function overload', () => {
    it('Should return a collection of objects when an array is provided as source', () => {
      const schema = { foo: 'bar' };
      const res = morphism(schema, [{ bar: 'test' }]);
      expect(res.map).toBeDefined();
      expect(res[0].foo).toEqual('test');
    });
    it('Should return a single object matching the schema structure when an object is provided as source', () => {
      const schema = { foo: 'bar' };
      const res = morphism(schema, { bar: 'test' });

      expect(res.foo).toEqual('test');
    });

    it('Should return a Mapper which outputs a Class Object when a Class Type is specified and no items', () => {
      class Foo {
        foo: string;
      }
      const schema = { foo: 'bar' };
      const source = { bar: 'value' };
      const mapper = morphism(schema, null, Foo);
      expect(mapper(source).foo).toEqual('value');
      expect(mapper([source][0]).foo).toEqual('value');
    });

    it('Should return a Mapper which outputs a Typed Object from the generic provided', () => {
      interface IFoo {
        foo: string;
      }
      const schema: Schema<IFoo> = { foo: 'bar' };
      const source = { bar: 'value' };
      const mapper = morphism(schema);

      expect(mapper(source).foo).toEqual('value');
      expect(mapper([source][0]).foo).toEqual('value');
    });

    it('Should do a straight mapping with an Interface provided', () => {
      interface Destination {
        foo: string;
        bar: string;
        qux: string;
      }
      interface Source {
        bar: string;
      }
      const schema: StrictSchema<Destination, Source> = {
        foo: 'bar',
        bar: 'bar',
        qux: elem => elem.bar,
      };
      const source = { bar: 'value' };

      const target = morphism(schema, source);
      const targets = morphism(schema, [source]);
      const singleTarget = targets.shift();

      expect(target.foo).toEqual('value');
      expect(singleTarget).toBeDefined();
      if (singleTarget) {
        expect(singleTarget.foo).toEqual('value');
      }
    });

    it('should return undefined when property with function action acts with when nested', () => {
      const source = {
        foo: 'value',
        bar: 'bar',
      };
      const schemaB = {
        some: 'test',
      };
      let schemaA = {
        f: 'foo',
        b: (data: any) => morphism(schemaB, data.undefined),
      };

      const res = morphism(schemaA, source);
      expect(res).toEqual({ f: 'value' });
      expect(['f', 'b']).toEqual(Object.keys(res));
    });

    it('should provide a mapper outputting class objects', () => {
      const source = {
        name: 'value',
      };
      const schema = {
        firstName: 'name',
      };

      const mapper = morphism(schema, null, User);
      const res = mapper(source);

      expect(res instanceof User).toBe(true);
      expect(res).toEqual(new User(source.name));
    });
  });

  describe('Plain Objects', function() {
    it('should export Morphism function curried function', function() {
      expect(typeof Morphism).toEqual('function');
    });

    it('should provide a mapper function from the partial application', function() {
      let fn = Morphism({});
      expect(typeof fn).toEqual('function');
    });

    it('should provide an Object as result when Morphism is applied on an Object', function() {
      expect(Morphism({}, {})).toEqual({});
    });

    it('should throw an exception when trying to access a path from an undefined object', function() {
      Morphism.setMapper<User, any>(User, {
        fieldWillThrow: {
          path: 'fieldWillThrow.becauseNotReachable',
          fn: (object: any) => {
            let failHere = object.value;
            return failHere;
          },
        },
      });
      let applyMapping = () =>
        Morphism.map(User, {
          fieldWillThrow: 'value',
        });
      expect(applyMapping).toThrow();
    });

    it('should rethrow an exception when applying a function on path throws an error', function() {
      const err = new TypeError('an internal error');
      Morphism.setMapper<User, any>(User, {
        fieldWillThrow: {
          path: 'fieldWillThrow',
          fn: () => {
            throw err;
          },
        },
      });
      let applyMapping = () =>
        Morphism.map(User, {
          fieldWillThrow: 'value',
        });
      expect(applyMapping).toThrow(err);
    });
  });

  describe('Collection of Objects', function() {
    it('should morph an empty array to an empty array || m({}, []) => []', function() {
      expect(Morphism({}, [])).toEqual([]);
    });

    it('should morph a collection of objects with a stored function || mapObject([{}]) => [Object{}]', function() {
      const input = [
        {
          firstName: 'John',
          lastName: 'Smith',
          number: '212 555-1234',
        },
        {
          firstName: 'James',
          lastName: 'Bond',
          number: '212 555-5678',
        },
      ];

      const output = [
        {
          firstName: 'John',
          lastName: 'Smith',
          phoneNumber: '212 555-1234',
        },
        {
          firstName: 'James',
          lastName: 'Bond',
          phoneNumber: '212 555-5678',
        },
      ];

      const schema = {
        phoneNumber: (object: any) => object.number,
      };

      Morphism.deleteMapper(User);
      const mapUser = Morphism.register(User, schema);
      const results = mapUser(input);
      results.forEach((res, index) => {
        expect(res).toEqual(jasmine.objectContaining(output[index]));
      });

      const mapUser2 = Morphism(schema, null, User);
      const results2 = mapUser2(input);

      results2.forEach((res, index) => {
        expect(res).toEqual(jasmine.objectContaining(output[index]));
      });

      const results3 = Morphism.map(User, input);
      results3.forEach((res, index) => {
        expect(res).toEqual(jasmine.objectContaining(output[index]));
      });

      const results4 = input.map(userInput => Morphism.map(User, userInput));
      results4.forEach((res, index) => {
        expect(res).toEqual(jasmine.objectContaining(output[index]));
      });
    });
  });

  describe('Mapper Instance', function() {
    it('should provide a pure idempotent mapper function from the partial application', function() {
      let schema = {
        user: ['firstName', 'lastName'],
        city: 'address.city',
      };
      let desiredResult = {
        user: {
          firstName: 'John',
          lastName: 'Smith',
        },
        city: 'New York',
      };
      let mapper = Morphism(schema);
      let results = mapper(dataToCrunch);

      expect(results[0]).toEqual(desiredResult);
      expect(results[0]).toEqual(mapper(dataToCrunch)[0]);
      expect(results[0].city).toEqual(desiredResult.city);
    });
  });

  describe('Schema', function() {
    describe('Action Selector', () => {
      it('should accept a selector action in deep nested schema property', () => {
        interface Source {
          keySource: string;
          keySource1: string;
        }
        const sample: Source = {
          keySource: 'value',
          keySource1: 'value1',
        };

        interface Target {
          keyA: {
            keyA1: [
              {
                keyA11: string;
                keyA12: number;
              }
            ];
            keyA2: string;
          };
        }
        const selector: ActionSelector<Source> = {
          path: 'keySource',
          fn: () => 'value-test',
        };
        const aggregator: ActionAggregator<Source> = ['keySource', 'keySource1'];
        const schema: StrictSchema<Target, Source> = {
          keyA: {
            keyA1: [{ keyA11: aggregator, keyA12: selector }],
            keyA2: 'keySource',
          },
        };

        const target = morphism(schema, sample);

        expect(target).toEqual({
          keyA: {
            keyA1: [
              {
                keyA11: {
                  keySource: 'value',
                  keySource1: 'value1',
                },
                keyA12: 'value-test',
              },
            ],
            keyA2: 'value',
          },
        });
      });
      it('should compute function on data from specified path', function() {
        let schema = {
          state: {
            path: 'address.state',
            fn: (s: any) => s.toLowerCase(),
          },
        };

        let desiredResult = {
          state: 'ny', // from NY to ny
        };
        let results = Morphism(schema, dataToCrunch);
        expect(results[0]).toEqual(desiredResult);
      });
      it('should allow to use an action selector without a `fn` specified', () => {
        interface Source {
          s1: string;
        }
        interface Target {
          t1: string;
        }
        const schema = createSchema<Target, Source>({ t1: { path: 's1' } });
        const result = morphism(schema, { s1: 'value' });
        expect(result.t1).toEqual('value');
      });

      it('should allow to use an action selector without a `fn` specified along with validation options', () => {
        interface Target {
          t1: string;
        }
        const schema = createSchema<Target>({
          t1: { path: 's1', validation: Validation.string() },
        });
        const result = morphism(schema, { s1: 1234 });
        const errors = reporter.report(result);
        expect(errors).not.toBeNull();
        if (errors) {
          expect(errors.length).toBe(1);
        }
      });

      it('should allow to use an action selector with a `fn` callback only', () => {
        interface Target {
          t1: string;
        }
        const schema = createSchema<Target>({ t1: { fn: value => value.s1 } });
        const result = morphism(schema, { s1: 'value' });
        expect(result.t1).toEqual('value');
      });

      it('should allow to use an action selector with a `fn` callback only along with validation options', () => {
        interface Target {
          t1: string;
        }
        const schema = createSchema<Target>({
          t1: { fn: value => value.s1, validation: Validation.string() },
        });
        const result = morphism(schema, { s1: 1234 });
        const errors = reporter.report(result);
        expect(errors).not.toBeNull();
        if (errors) {
          expect(errors.length).toBe(1);
        }
      });

      it('should throw an exception when a schema property is an empty object', () => {
        const schema = createSchema({ prop: {} });
        expect(() => {
          morphism(schema, {});
        }).toThrow(`A value of a schema property can't be an empty object. Value {} found for property prop`);
      });

      it('should throw an exception when a schema property is not supported', () => {
        const schema = createSchema({ prop: 1234 });
        expect(() => {
          morphism(schema, {});
        }).toThrow(`The action specified for prop is not supported.`);
      });
    });
    describe('Function Predicate', function() {
      it('should support es6 destructuring as function predicate', function() {
        let schema = {
          target: ({ source }: { source: string }) => source,
        };
        let mock = {
          source: 'value',
        };
        let expected = {
          target: 'value',
        };
        let result = Morphism(schema, mock);
        expect(result).toEqual(expected);
        expect(result.target).toEqual(expected.target);
        expect(result.target.replace).toBeDefined();
      });

      it('should support nesting mapping', function() {
        let nestedSchema = {
          target1: 'source',
          target2: ({ nestedSource }: any) => nestedSource.source,
        };
        let schema = {
          complexTarget: ({ complexSource }: any) => Morphism(nestedSchema, complexSource),
        };
        let mock = {
          complexSource: {
            source: 'value1',
            nestedSource: {
              source: 'value2',
            },
          },
        };
        let expected = {
          complexTarget: {
            target1: 'value1',
            target2: 'value2',
          },
        };
        let result = Morphism(schema, mock);
        expect(result).toEqual(expected);
      });

      it('should be resilient when doing nesting mapping and using destructuration on array', function() {
        let nestedSchema = {
          target: 'source',
          nestedTargets: ({ nestedSources }: any) => Morphism({ nestedTarget: ({ nestedSource }: any) => nestedSource }, nestedSources),
        };
        let schema = {
          complexTarget: ({ complexSource }: any) => Morphism(nestedSchema, complexSource),
        };
        let mock: any = {
          complexSource: {
            source: 'value1',
            nestedSources: [],
          },
        };
        let expected: any = {
          complexTarget: {
            target: 'value1',
            nestedTargets: [],
          },
        };
        let result = Morphism(schema, mock);
        expect(result).toEqual(expected);
      });
    });
    describe('createSchema', () => {
      it('should return a schema', () => {
        interface Target {
          keyA: string;
        }
        interface Source {
          s1: string;
        }
        const schema = createSchema<Target, Source>({ keyA: 's1' });
        expect(schema).toEqual({ keyA: 's1' });
        const res = morphism(schema, { s1: 'value' });
        expect(res).toEqual({ keyA: 'value' });
      });

      it('should return a schema with options', () => {
        interface Target {
          keyA: string;
        }
        interface Source {
          s1: string;
        }
        const options: SchemaOptions = {
          class: { automapping: true },
          undefinedValues: { strip: true },
        };
        const schema = createSchema<Target, Source>({ keyA: 's1' }, options);
        const res = morphism(schema, { s1: 'value' });

        expect(schema).toEqual({
          keyA: 's1',
          [SCHEMA_OPTIONS_SYMBOL]: options,
        });
        expect(res).toEqual({ keyA: 'value' });
      });

      it('should allow schema options using symbol', () => {
        const source = {
          foo: 'value',
          bar: 'bar',
        };
        const schemaB = {
          some: 'test',
        };
        const options: SchemaOptions = { undefinedValues: { strip: true } };
        let schemaA = {
          f: 'foo',
          b: (data: any) => morphism(schemaB, data.undefined),
          [SCHEMA_OPTIONS_SYMBOL]: options,
        };

        const res = morphism(schemaA, source);
        expect(res).toEqual({ f: 'value' });
        expect(['f']).toEqual(Object.keys(res));
      });

      it('should strip undefined values from target when option is provided', () => {
        const source = {
          foo: 'value',
          bar: 'bar',
        };
        const schemaB = {
          some: 'test',
        };
        let schemaA = createSchema(
          {
            f: 'foo',
            b: (data: any) => morphism(schemaB, data.undefined),
          },
          { undefinedValues: { strip: true } }
        );

        const res = morphism(schemaA, source);
        expect(res).toEqual({ f: 'value' });
        expect(['f']).toEqual(Object.keys(res));
      });

      it('should fallback to default when undefined value on target', () => {
        const source = {};
        const schema = createSchema(
          { key: 'foo' },
          {
            undefinedValues: {
              strip: true,
              default: () => null,
            },
          }
        );

        expect(morphism(schema, source)).toEqual({ key: null });
      });

      it('should throw when validation.throw option is set to true', () => {
        interface Source {
          s1: string;
        }
        interface Target {
          t1: string;
          t2: string;
        }
        const schema = createSchema<Target, Source>(
          {
            t1: { fn: value => value.s1, validation: Validation.string() },
            t2: { fn: value => value.s1, validation: Validation.string() },
          },
          { validation: { throw: true } }
        );
        const error1 = new ValidationError({
          targetProperty: 't1',
          innerError: new ValidatorError({
            expect: `Expected value to be a <string> but received <${undefined}>`,
            value: undefined,
          }),
        });
        const error2 = new ValidationError({
          targetProperty: 't2',
          innerError: new ValidatorError({
            expect: `Expected value to be a <string> but received <${undefined}>`,
            value: undefined,
          }),
        });

        const message1 = defaultFormatter(error1);
        const message2 = defaultFormatter(error2);

        expect(() => {
          morphism(schema, JSON.parse('{}'));
        }).toThrow(`${message1}\n${message2}`);
      });
    });
  });

  describe('Paths Aggregation', function() {
    it('should return a object of aggregated values given a array of paths', function() {
      let schema = {
        user: ['firstName', 'lastName'],
      };

      let desiredResult = {
        user: {
          firstName: 'John',
          lastName: 'Smith',
        },
      };
      let results = Morphism(schema, dataToCrunch);
      expect(results[0]).toEqual(desiredResult);
    });

    it('should return a object of aggregated values given a array of paths (nested path case)', function() {
      let schema = {
        user: ['firstName', 'address.city'],
      };

      let desiredResult = {
        user: {
          firstName: 'John',
          address: {
            city: 'New York',
          },
        },
      };
      let results = Morphism(schema, dataToCrunch);
      expect(results[0]).toEqual(desiredResult);
    });

    it('should provide an aggregate as a result from an array of paths when applying a function', () => {
      let data = { a: 1, b: { c: 2 } };
      let rules = {
        ac: {
          path: ['a', 'b.c'],
          fn: (aggregate: any) => {
            expect(aggregate).toEqual({ a: 1, b: { c: 2 } });
            return aggregate;
          },
        },
      };
      let res = Morphism(rules, data);

      expect(res).toEqual({ ac: { a: 1, b: { c: 2 } } });
    });
  });

  describe('Flattening and Projection', function() {
    it('should flatten data from specified path', function() {
      interface Source {
        firstName: string;
        lastName: string;
        address: { city: string };
      }
      interface Target {
        firstName: string;
        lastName: string;
        city: string;
      }
      let schema: StrictSchema<Target, Source> = {
        firstName: 'firstName',
        lastName: 'lastName',
        city: 'address.city',
      };

      let desiredResult = {
        firstName: 'John',
        lastName: 'Smith',
        city: 'New York',
      };
      let results = Morphism(schema, dataToCrunch);
      expect(results[0]).toEqual(desiredResult);
    });

    it('should pass the object value to the function when no path is specified', function() {
      interface D {
        firstName: string;
        lastName: string;
        city: string;
        status: string;
      }

      let schema: StrictSchema<D, MockData> = {
        firstName: 'firstName',
        lastName: 'lastName',
        city: { path: 'address.city', fn: prop => prop },
        status: o => o.phoneNumber[0].type,
      };

      let desiredResult = {
        firstName: 'John',
        lastName: 'Smith',
        city: 'New York',
        status: 'home',
      };
      let results = Morphism(schema, dataToCrunch);
      expect(results[0]).toEqual(desiredResult);
    });

    it('should accept deep nested actions', () => {
      interface Source {
        keyA: string;
      }
      const sample: Source = {
        keyA: 'value',
      };

      interface Target {
        keyA: { keyA1: string };
      }

      const schema: StrictSchema<Target, Source> = {
        keyA: { keyA1: source => source.keyA },
      };

      const target = morphism(schema, sample);
      expect(target).toEqual({ keyA: { keyA1: 'value' } });
    });

    it('should accept deep nested actions into array', () => {
      interface Source {
        keySource: string;
      }
      const sample: Source = {
        keySource: 'value',
      };

      interface Target {
        keyA: {
          keyA1: [
            {
              keyA11: string;
              keyA12: number;
            }
          ];
          keyA2: string;
        };
      }
      const schema: StrictSchema<Target, Source> = {
        keyA: {
          keyA1: [{ keyA11: 'keySource', keyA12: 'keySource' }],
          keyA2: 'keySource',
        },
      };

      const target = morphism(schema, sample);

      expect(target).toEqual({
        keyA: { keyA1: [{ keyA11: 'value', keyA12: 'value' }], keyA2: 'value' },
      });
    });
  });
});
