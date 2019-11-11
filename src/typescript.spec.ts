import Morphism, { morphism, StrictSchema, Schema, createSchema } from './morphism';

describe('Typescript', () => {
  describe('Registry Type Checking', () => {
    it('Should return a Mapper when using Register', () => {
      class Foo {
        foo: string;
      }
      const schema = { foo: 'bar' };
      const source = { bar: 'value' };
      const mapper = Morphism.register(Foo, schema);

      expect(mapper(source).foo).toEqual('value');
      expect(mapper([source][0]).foo).toEqual('value');
    });
  });

  describe('Schema Type Checking', () => {
    it('Should allow to type the Schema', () => {
      interface IFoo {
        foo: string;
        bar: number;
      }
      const schema: Schema<IFoo> = { foo: 'qux' };
      const source = { qux: 'foo' };
      const target = morphism(schema, source);

      expect(target.foo).toEqual(source.qux);
    });

    it('Should allow to use a strict Schema', () => {
      interface IFoo {
        foo: string;
        bar: number;
      }
      const schema: StrictSchema<IFoo> = { foo: 'qux', bar: () => 1 };
      const source = { qux: 'foo' };
      const target = morphism(schema, source);

      expect(target.foo).toEqual(source.qux);
      expect(target.bar).toEqual(1);
    });

    it('should accept 2 generic parameters on StrictSchema', () => {
      interface Source {
        inputA: string;
        inputB: string;
        inputC: string;
      }
      interface Destination {
        fooA: string;
        fooB: string;
        fooC: string;
      }
      const schema: StrictSchema<Destination, Source> = {
        fooA: 'inputA',
        fooB: ({ inputB }) => inputB,
        fooC: 'inputC'
      };

      const mapper = morphism(schema);

      expect(mapper({ inputA: 'test', inputB: 'test2', inputC: 'test3' })).toEqual({
        fooA: 'test',
        fooB: 'test2',
        fooC: 'test3'
      });
    });

    it('should accept 2 generic parameters on Schema', () => {
      interface Source2 {
        inputA: string;
      }
      const schema: Schema<{ foo: string }, Source2> = {
        foo: 'inputA'
      };
      morphism(schema, { inputA: 'test' });
      morphism(schema, [{ inputA: '' }]);
    });

    it('should accept 2 generic parameters on Schema', () => {
      interface S {
        s1: string;
      }
      interface D {
        d1: string;
      }
      const schema: StrictSchema<D, S> = {
        d1: 's1'
      };
      const a = morphism(schema)([{ s1: 'test' }]);
      const itemA = a.shift();
      expect(itemA).toBeDefined();
      if (itemA) {
        itemA.d1;
      }
      morphism(schema, { s1: 'teest' }).d1.toString();
      const b = morphism(schema, [{ s1: 'teest' }]);
      const itemB = b.shift();
      expect(itemB).toBeDefined();
      if (itemB) {
        itemB.d1;
      }
      morphism(schema, [{ s1: 'teest' }]);
      morphism(schema, [{ s1: 'test' }]);
    });

    it('should not fail with typescript', () => {
      interface S {
        s1: string;
      }
      interface D {
        d1: string;
      }

      interface Source {
        boring_api_field: number;
      }
      const source: Source[] = [{ boring_api_field: 2 }];

      interface Destination {
        namingIsHard: string;
      }

      const a = morphism<StrictSchema<Destination, Source>>({ namingIsHard: 'boring_api_field' }, [{ boring_api_field: 2 }]);
      const itemA = a.pop();
      expect(itemA).toBeDefined();
      if (itemA) {
        itemA.namingIsHard;
      }

      const b = morphism<StrictSchema<Destination, Source>>({ namingIsHard: 'boring_api_field' }, { boring_api_field: 2 });
      b.namingIsHard;

      const c = morphism<StrictSchema<Destination>>({ namingIsHard: 'boring_api_field' }, [{ boring_api_field: 2 }]);
      const itemC = c.pop();
      expect(itemC).toBeDefined();
      if (itemC) {
        itemC.namingIsHard;
      }

      const d = morphism<Destination>({ namingIsHard: 'boring_api_field' }, { boring_api_field: 2 });
      d.namingIsHard;

      morphism({ namingIsHard: 'boring_api_field' });
      morphism<StrictSchema<Destination, Source>>({ namingIsHard: 'boring_api_field' })({ boring_api_field: 2 });
      const e = morphism<StrictSchema<Destination>>({ namingIsHard: 'boring_api_field' })([{ boring_api_field: 2 }]);
      const itemE = e.pop();
      expect(itemE).toBeDefined();
      if (itemE) {
        itemE.namingIsHard;
      }

      interface S1 {
        _a: string;
      }
      interface D1 {
        a: string;
      }

      morphism<StrictSchema<D1, S1>>({ a: ({ _a }) => _a.toString() });
      morphism<StrictSchema<D1, S1>>({ a: ({ _a }) => _a.toString() });
    });

    it('shoud infer result type from source when a class is provided', () => {
      class Source {
        constructor(public id: number, public ugly_field: string) {}
      }

      class Destination {
        constructor(public id: number, public field: string) {}
      }

      const source = [new Source(1, 'abc'), new Source(1, 'def')];

      const schema: StrictSchema<Destination, Source> = {
        id: 'id',
        field: 'ugly_field'
      };
      const expected = [new Destination(1, 'abc'), new Destination(1, 'def')];

      const result = morphism(schema, source, Destination);
      result.forEach((item, idx) => {
        expect(item).toEqual(expected[idx]);
      });
    });

    it('should accept union types as Target', () => {
      const schema = createSchema<{ a: string } | { a: string; b: string }, { c: string }>({
        a: ({ c }) => c
      });

      expect(morphism(schema, { c: 'result' }).a).toEqual('result');
    });
  });

  describe('Morphism Function Type Checking', () => {
    it('should infer target type from array input', () => {
      interface Source {
        ID: number;
      }

      interface Destination {
        id: number;
      }

      const rows: Array<Source> = [{ ID: 1234 }];

      const schema: StrictSchema<Destination, Source> = { id: 'ID' };
      expect(morphism(schema, rows)).toBeDefined();
      expect(morphism(schema, rows)[0].id).toEqual(1234);
    });
  });
});
