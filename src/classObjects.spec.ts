import { toClassObject, morph } from './morphism';

describe('Morphism', () => {
  describe('Class Objects', () => {
    describe('Decorators - Function Decorator', () => {
      const schema = { foo: 'bar' };
      interface ITarget {
        foo: string | null;
      }
      class Target implements ITarget {
        foo = null;
      }

      class Service {
        @toClassObject(schema, Target)
        fetch(source: any) {
          return Promise.resolve(source);
        }
        @toClassObject(schema, Target)
        fetch2(source: any) {
          return source;
        }
        @toClassObject(schema, Target)
        async fetch3(source: any) {
          return await (async () => source)();
        }
        @toClassObject(schema, Target)
        fetchMultiple(source: any) {
          return [source, source];
        }
        @morph(schema, Target)
        withMorphDecorator(source: any) {
          return source;
        }
      }

      const service = new Service();
      interface ISource {
        bar: string;
      }

      const source: ISource = {
        bar: 'value'
      };

      it('should create a Class Object when a Promise is used', function() {
        service.fetch(source).then((result: any) => expect(result instanceof Target).toBe(true));
      });
      it('should support a function returning an array of Class Object or a Class Object', () => {
        expect(service.fetch2(source) instanceof Target).toBe(true);
      });
      it('should support an aync function', async function() {
        const res = await service.fetch3(source);
        expect(res instanceof Target).toBe(true);
      });
      it('should support a function returning an array of Class Objects', function() {
        service.fetchMultiple(source).forEach(item => expect(item instanceof Target).toBe(true));
      });
      it('should allow to morph with Morph decorator to Class Object', function() {
        expect(service.withMorphDecorator(source) instanceof Target).toBe(true);
      });
    });
  });
});
