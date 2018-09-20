import Morphism, { morphism, Schema } from './morphism';

describe('Morphism', () => {
  describe('Currying Function overload', () => {
    it('Should return a collection of objects when an array is provided as source', () => {
      const schema = { foo: 'bar' };
      const res: { foo: string }[] = morphism(schema, [{ bar: 'test' }]);

      expect(res.map).toBeDefined();
      expect(res[0].foo).toEqual('test');
    });
    it('Should return a single object matching the schema structure when an object is provided as source', () => {
      const schema = { foo: 'bar' };
      const res: { foo: string } = morphism(schema, { bar: 'test' });

      expect(res.foo).toEqual('test');
    });
  });
});
