import { morphism, createSchema } from '../morphism';
import { defaultFormatter, reporter } from './reporter';
import { PropertyValidationError } from './PropertyValidationError';
import { Validation } from './Validation';

describe('Reporter', () => {
  describe('Formatter', () => {
    it('should format a ValidationError to human readable message', () => {
      const targetProperty = 'targetProperty';
      const value = undefined;
      const error = new PropertyValidationError({ expect: 'message', value });
      const message = defaultFormatter({ targetProperty, ...error });
      expect(message).toEqual(`Invalid value ${value} supplied at property ${targetProperty}. Expecting: ${error.expect}`);
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
        t1: { path: 's1', fn: val => val, validation: Validation.boolean() },
        t2: { path: 's2', fn: val => val, validation: Validation.number() }
      });
      const result = morphism(schema, JSON.parse('{}'));
      const errors = reporter.report(result);
      const error1 = new PropertyValidationError({ expect: 'value to be typeof boolean', value: undefined });
      const error2 = new PropertyValidationError({ expect: 'value to be typeof number', value: undefined });

      const message1 = defaultFormatter({ targetProperty: 't1', ...error1 });
      const message2 = defaultFormatter({ targetProperty: 't2', ...error2 });
      expect(errors).not.toBeNull();
      if (errors) {
        expect(errors.length).toEqual(2);
        expect(errors[0]).toBe(message1);
        expect(errors[1]).toBe(message2);
      }
    });

    it('should throw an exception when trying to use a rule more than once', () => {
      expect(() => {
        Validation.string()
          .max(1)
          .max(1);
      }).toThrow('Rule max has already been used');
    });

    describe('string', () => {
      it('should report error on string undefined', () => {
        interface S {
          s1: string;
        }
        interface T {
          t1: string;
        }

        const schema = createSchema<T, S>({ t1: { path: 's1', fn: val => val, validation: Validation.string() } });
        const result = morphism(schema, JSON.parse('{}'));
        const error = new PropertyValidationError({ expect: 'value to be typeof string', value: undefined });
        const message = defaultFormatter({ targetProperty: 't1', ...error });
        const errors = reporter.report(result);
        expect(errors).not.toBeNull();
        if (errors) {
          expect(errors.length).toEqual(1);
          expect(errors[0]).toBe(message);
        }
      });

      it('should report error when string max length is not met', () => {
        interface S {
          s1: string;
        }
        interface T {
          t1: string;
        }

        const schema = createSchema<T, S>({ t1: { fn: value => value.s1, validation: Validation.string().max(3) } });
        const result = morphism(schema, { s1: 'value' });
        const error = new PropertyValidationError({ expect: `value to be less or equal than 3`, value: 'value' });
        const message = defaultFormatter({ targetProperty: 't1', ...error });
        const errors = reporter.report(result);
        expect(errors).not.toBeNull();
        if (errors) {
          expect(errors.length).toEqual(1);
          expect(errors[0]).toBe(message);
        }
      });

      it('should report error when string min length is not met', () => {
        interface S {
          s1: string;
        }
        interface T {
          t1: string;
        }

        const schema = createSchema<T, S>({ t1: { fn: value => value.s1, validation: Validation.string().min(3) } });
        const result = morphism(schema, { s1: 'a' });
        const error = new PropertyValidationError({ expect: `value to be greater or equal than 3`, value: 'a' });
        const message = defaultFormatter({ targetProperty: 't1', ...error });
        const errors = reporter.report(result);
        expect(errors).not.toBeNull();
        if (errors) {
          expect(errors.length).toEqual(1);
          expect(errors[0]).toBe(message);
        }
      });

      it('should return the value when the validation pass', () => {
        interface S {
          s1: string;
        }
        interface T {
          t1: string;
        }

        const schema = createSchema<T, S>({
          t1: {
            fn: value => value.s1,
            validation: Validation.string()
              .min(1)
              .max(3)
          }
        });
        const result = morphism(schema, { s1: 'aaa' });
        const errors = reporter.report(result);
        expect(errors).toBeNull();
        expect(result.t1).toBe('aaa');
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

        const schema = createSchema<T, S>({ t1: { path: 's1', fn: val => val, validation: Validation.number() } });
        const result = morphism(schema, JSON.parse('{}'));
        const error = new PropertyValidationError({ expect: 'value to be typeof number', value: undefined });
        const message = defaultFormatter({ targetProperty: 't1', ...error });
        const errors = reporter.report(result);
        expect(errors).not.toBeNull();
        if (errors) {
          expect(errors.length).toEqual(1);
          expect(errors[0]).toBe(message);
        }
      });
      it('should parse number from string', () => {
        interface S {
          s1: string;
        }
        interface T {
          t1: number;
        }

        const schema = createSchema<T, S>({ t1: { path: 's1', fn: val => val, validation: Validation.number() } });
        const result = morphism(schema, JSON.parse('{ "s1": "1234" }'));
        const errors = reporter.report(result);
        expect(errors).toBeNull();
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

        const schema = createSchema<T, S>({ t1: { path: 's1', fn: val => val, validation: Validation.boolean() } });
        const result = morphism(schema, JSON.parse('{ "s1": true }'));
        const errors = reporter.report(result);
        expect(errors).toBeNull();
        expect(result).toEqual({ t1: true });
      });

      it('should return a boolean true from a string', () => {
        interface S {
          s1: boolean;
        }
        interface T {
          t1: boolean;
        }

        const schema = createSchema<T, S>({ t1: { path: 's1', fn: val => val, validation: Validation.boolean() } });
        const result = morphism(schema, JSON.parse('{ "s1": "true" }'));
        const errors = reporter.report(result);
        expect(errors).toBeNull();
        expect(result).toEqual({ t1: true });
      });

      it('should return a boolean false from a string', () => {
        interface S {
          s1: boolean;
        }
        interface T {
          t1: boolean;
        }

        const schema = createSchema<T, S>({ t1: { path: 's1', fn: val => val, validation: Validation.boolean() } });
        const result = morphism(schema, JSON.parse('{ "s1": "false" }'));
        const errors = reporter.report(result);
        expect(errors).toBeNull();
        expect(result).toEqual({ t1: false });
      });

      it('should return an error', () => {
        interface S {
          s1: boolean;
        }
        interface T {
          t1: boolean;
        }

        const schema = createSchema<T, S>({ t1: { path: 's1', fn: val => val, validation: Validation.boolean() } });
        const result = morphism(schema, JSON.parse('{ "s1": "a value" }'));
        const error = new PropertyValidationError({ expect: 'value to be typeof boolean', value: 'a value' });
        const message = defaultFormatter({ targetProperty: 't1', ...error });

        const errors = reporter.report(result);

        expect(result.t1).toEqual('a value');
        expect(errors).not.toBeNull();
        if (errors) {
          expect(errors.length).toEqual(1);
          expect(errors[0]).toBe(message);
        }
      });
    });
  });
});
