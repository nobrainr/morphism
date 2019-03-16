import { morphism, StrictSchema, Schema } from './morphism';

describe('Morphism', () => {
  describe('Typescript', () => {
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
      morphism(schema, [{}]);
    });

    xit('should fail with typescript', () => {
      interface S {
        s1: string;
      }
      interface D {
        d1: string;
      }
      const schema: StrictSchema<D, S> = {
        d1: 's1'
      };

      interface Source {
        boring_api_field: number;
      }
      const source: Source[] = [{ boring_api_field: 2 }];

      interface Destination {
        namingIsHard: string;
      }

      const a = morphism<Destination, Source>({ namingIsHard: 'boring_api_field' }, [{ boring_api_field: 2 }]);
      const itemA = a.pop();
      expect(itemA).toBeDefined();
      if (itemA) {
        itemA.namingIsHard;
      }

      const b = morphism<Destination, Source>({ namingIsHard: 'boring_api_field' }, { boring_api_field: 2 });
      b.namingIsHard;

      const c = morphism<Destination>({ namingIsHard: 'boring_api_field' }, [{ boring_api_field: 2 }]);
      const itemC = c.pop();
      expect(itemC).toBeDefined();
      if (itemC) {
        itemC.namingIsHard;
      }

      const d = morphism<Destination>({ namingIsHard: 'boring_api_field' }, { boring_api_field: 2 });
      d.namingIsHard;

      morphism({ namingIsHard: 'boring_api_field' });
      morphism<Destination, Source>({ namingIsHard: 'boring_api_field' })({ boring_api_field: 2 });
      const e = morphism<Destination>({ namingIsHard: 'boring_api_field' })([{ boring_api_field: 2 }]);
      const itemE = e.pop();
      expect(itemE).toBeDefined();
      if (itemE) {
        itemE.namingIsHard;
      }
    });

    it('', () => {
      interface S {
        _a: string;
      }
      interface D {
        a: string;
      }

      morphism<D, S>({ a: ({ _a }) => _a.toString() });
      morphism<D, S>({ a: ({ _a }) => _a.toString() });
      // morphism({ a: ({ b }) => b }, { _a: 'value' });
      // morphism({ a: ({ b }) => b });
    });
  });
});
