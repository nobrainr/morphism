import Morphism, { toJSObject, morph } from './morphism';

describe('Morphism', () => {
  describe('Javascript Objects', () => {
    it('should morph an empty Object to an empty Object || m({}, {}) => {}', function() {
      expect(Morphism({}, {})).toEqual({});
    });

    it('should allow to use a mapper as an iteratee first function', function() {
      let mocks = [{ source: 'value' }, { source: 'value' }, { source: 'value' }];
      let schema = {
        target: 'source'
      };
      const mapper = Morphism(schema);

      let results = mocks.map(mapper);
      results.forEach(res => {
        expect(res).toEqual({ target: 'value' });
      });
    });

    it('should allow to use a mapper declaration as an iteratee first function', function() {
      let mocks = [{ source: 'value' }, { source: 'value' }, { source: 'value' }];
      let schema = {
        target: 'source'
      };

      let results = mocks.map(Morphism(schema));
      results.forEach(res => {
        expect(res).toEqual({ target: 'value' });
      });
    });

    describe('Decorators - Function Decorator', () => {
      const schema = { foo: 'bar' };

      class Service {
        @toJSObject(schema)
        fetch(source: any) {
          return Promise.resolve(source);
        }
        @toJSObject(schema)
        fetch2(source: any) {
          return source;
        }
        @toJSObject(schema)
        async fetch3(source: any) {
          return await (async () => source)();
        }
        @morph(schema)
        withMorphDecorator(source: any) {
          return source;
        }
        @toJSObject(schema)
        fetchFail(source: any) {
          return Promise.reject(source);
        }
      }

      const service = new Service();
      interface ISource {
        bar: string;
      }
      interface ITarget {
        foo: string;
      }
      const source: ISource = {
        bar: 'value'
      };
      const expected: ITarget = {
        foo: 'value'
      };

      it('should support a function returning a promise', function() {
        service.fetch(source).then((result: any) => expect(result).toEqual(expected));
      });
      it('should support a function returning an array or an object', () => {
        expect(service.fetch2(source)).toEqual(expected);
      });
      it('should support an aync function', async function() {
        const res = await service.fetch3(source);
        expect(res).toEqual(expected);
      });
      it('should allow to morph with Morph decorator to Class Object', function() {
        expect(service.withMorphDecorator(source)).toEqual(expected);
      });
      it('should not swallow error when promise fails', function() {
        service.fetchFail(source).catch(data => {
          expect(data).toEqual(source);
        });
      });
    });
  });
});
