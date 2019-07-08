import { morphism, createSchema } from '../morphism';
import { string, boolean } from './validators';
import { number } from './validators';
import { formatter, reporter } from './reporter';
import { getSymbolName } from '../helpers';

describe('Reporter', () => {
  describe('Formatter', () => {
    it('should format a ValidationError to human readable message', () => {
      const targetProperty = 'targetProperty';
      const value = undefined;
      const type = string;
      const message = formatter({ targetProperty, value, type });
      expect(message).toEqual(
        `Invalid value ${value} supplied to : [⚠️ Schema With Type] at property ${targetProperty}. Expecting type ${getSymbolName(type)}`
      );
    });
  });
  describe('Validation', () => {
    it('should add multiple errors', () => {
      interface S {
        s1: boolean;
        s2: number;
      }
      interface T {
        t1: boolean;
        t2: number;
      }

      const schema = createSchema<T, S>({
        t1: { path: 's1', fn: val => val, type: boolean },
        t2: { path: 's2', fn: val => val, type: number }
      });
      const result = morphism(schema, JSON.parse('{}'));
      const errors = reporter(result);
      const message1 = formatter({ targetProperty: 't1', value: undefined, type: boolean });
      const message2 = formatter({ targetProperty: 't2', value: undefined, type: number });

      expect(errors.length).toEqual(2);
      expect(errors[0]).toBe(message1);
      expect(errors[1]).toBe(message2);
    });

    describe('string', () => {
      it('should report error on string undefined', () => {
        interface S {
          s1: string;
        }
        interface T {
          t1: string;
        }

        const schema = createSchema<T, S>({ t1: { path: 's1', fn: val => val, type: string } });
        const result = morphism(schema, JSON.parse('{}'));
        const message = formatter({ targetProperty: 't1', value: undefined, type: string });
        const errors = reporter(result);

        expect(errors.length).toEqual(1);
        expect(errors[0]).toBe(message);
      });
    });

    describe('number', () => {
      it('should report error on number undefined', () => {
        interface S {
          s1: string;
        }
        interface T {
          t1: number;
        }

        const schema = createSchema<T, S>({ t1: { path: 's1', fn: val => val, type: number } });
        const result = morphism(schema, JSON.parse('{}'));
        const message = formatter({ targetProperty: 't1', value: undefined, type: number });
        const errors = reporter(result);

        expect(errors.length).toEqual(1);
        expect(errors[0]).toBe(message);
      });
      it('should parse number from string', () => {
        interface S {
          s1: string;
        }
        interface T {
          t1: number;
        }

        const schema = createSchema<T, S>({ t1: { path: 's1', fn: val => val, type: number } });
        const result = morphism(schema, JSON.parse('{ "s1": "1234" }'));
        const errors = reporter(result);

        expect(errors.length).toEqual(0);
        expect(result).toEqual({ t1: 1234 });
      });
    });

    describe('boolean', () => {
      it('should return a boolean if a boolean has been provided', () => {
        interface S {
          s1: boolean;
        }
        interface T {
          t1: boolean;
        }

        const schema = createSchema<T, S>({ t1: { path: 's1', fn: val => val, type: boolean } });
        const result = morphism(schema, JSON.parse('{ "s1": true }'));
        const errors = reporter(result);

        expect(errors.length).toEqual(0);
        expect(result).toEqual({ t1: true });
      });

      it('should return a boolean true from a string', () => {
        interface S {
          s1: boolean;
        }
        interface T {
          t1: boolean;
        }

        const schema = createSchema<T, S>({ t1: { path: 's1', fn: val => val, type: boolean } });
        const result = morphism(schema, JSON.parse('{ "s1": "true" }'));
        const errors = reporter(result);

        expect(errors.length).toEqual(0);
        expect(result).toEqual({ t1: true });
      });

      it('should return a boolean false from a string', () => {
        interface S {
          s1: boolean;
        }
        interface T {
          t1: boolean;
        }

        const schema = createSchema<T, S>({ t1: { path: 's1', fn: val => val, type: boolean } });
        const result = morphism(schema, JSON.parse('{ "s1": "false" }'));
        const errors = reporter(result);

        expect(errors.length).toEqual(0);
        expect(result).toEqual({ t1: false });
      });

      it('should return an error', () => {
        interface S {
          s1: boolean;
        }
        interface T {
          t1: boolean;
        }

        const schema = createSchema<T, S>({ t1: { path: 's1', fn: val => val, type: boolean } });
        const result = morphism(schema, JSON.parse('{ "s1": "a value" }'));
        const errors = reporter(result);
        const message = formatter({ targetProperty: 't1', value: 'a value', type: boolean });

        expect(result.t1).toEqual('a value');
        expect(errors.length).toEqual(1);
        expect(errors[0]).toBe(message);
      });
    });
  });
});
