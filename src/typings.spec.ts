import Morphism, { morphism, Schema } from './morphism';

describe('Morphism', () => {
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
  });

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
});
