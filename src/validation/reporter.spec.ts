import { morphism, createSchema } from '../morphism';
import { string } from './validators';
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
});
