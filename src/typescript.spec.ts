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
      const schema = {
        fooA: 'inputA',
        fooB: ({ inputB }) => inputB,
        fooC: 'inputC'
      } as StrictSchema<Destination, Source>;

      const mapper = morphism(schema);
      const res = mapper({}) as Destination;
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
  });
});
