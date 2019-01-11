import { StrictSchema, Schema, morphism } from './morphism';

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
      morphism(schema)([{ s1: 'test' }]).shift().d1;
      morphism(schema, { s1: 'teest' }).d1.toString();
      morphism(schema, [{ s1: 'teest' }]).shift().d1;
      morphism(schema, [{ s1: 'teest' }]);
      morphism(schema, [{ s1: 'test' }]);
      // morphism(schema,[{}])
    });

    // xit('should fail with typescript', () => {
    //   interface S {
    //     s1: string;
    //   }
    //   interface D {
    //     d1: string;
    //   }
    //   const schema: StrictSchema<D, S> = {
    //     d1: 's1'
    //   };
    //   morphism(schema, [{ toto: 'test' }]);
    // });
  });
});
