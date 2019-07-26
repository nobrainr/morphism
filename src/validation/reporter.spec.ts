import { morphism, createSchema, Reporter } from '../morphism';
import { defaultFormatter, reporter, ValidationError, Formatter } from './reporter';
import { Validation } from './Validation';

describe('Reporter', () => {
  describe('Formatter', () => {
    it('should format a ValidationError to human readable message', () => {
      const targetProperty = 'targetProperty';
      const value = undefined;
      const error = new ValidationError({ targetProperty, expect: 'message', value });
      const message = defaultFormatter(error);
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
      const error1 = new ValidationError({ targetProperty: 't1', expect: 'value to be typeof boolean', value: undefined });
      const error2 = new ValidationError({ targetProperty: 't2', expect: 'value to be typeof number', value: undefined });

      const message1 = defaultFormatter(error1);
      const message2 = defaultFormatter(error2);
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

    it('should allow to use a reporter with a custom formatter', () => {
      interface Target {
        t1: string;
      }
      const formatter: Formatter = error => {
        const { expect, targetProperty, value } = error;
        return `Expected ${expect} but received ${value} for property ${targetProperty}`;
      };
      const reporter = new Reporter(formatter);

      const schema = createSchema<Target>({ t1: { path: 's1', validation: Validation.string() } });
      const result = morphism(schema, { s1: 1234 });
      const error = new ValidationError({ targetProperty: 't1', value: 1234, expect: 'value to be typeof string' });
      const message = formatter(error);
      const errors = reporter.report(result);
      expect(errors).not.toBeNull();
      if (errors) {
        expect(errors[0]).toBe(message);
      }
    });

    it('should allow to use a reporter with a custom formatter via schema options', () => {
      interface Target {
        t1: string;
      }
      const formatter: Formatter = error => {
        const { expect, targetProperty, value } = error;
        return `Expected ${expect} but received ${value} for property ${targetProperty}`;
      };
      const reporter = new Reporter(formatter);

      const schema = createSchema<Target>(
        { t1: { path: 's1', validation: Validation.string() } },
        { validation: { throw: true, reporter } }
      );

      const error = new ValidationError({ targetProperty: 't1', value: 1234, expect: 'value to be typeof string' });
      const message = formatter(error);
      expect(() => {
        morphism(schema, { s1: 1234 });
      }).toThrow(message);
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
        const error = new ValidationError({ targetProperty: 't1', expect: 'value to be typeof string', value: undefined });
        const message = defaultFormatter(error);
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
        const error = new ValidationError({ targetProperty: 't1', expect: `value to be less or equal than 3`, value: 'value' });
        const message = defaultFormatter(error);
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
        const error = new ValidationError({ targetProperty: 't1', expect: `value to be greater or equal than 3`, value: 'a' });
        const message = defaultFormatter(error);
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

      it('should report an error when string length is not met', () => {
        interface S {
          s1: string;
        }
        interface T {
          t1: string;
        }

        const LENGTH = 1;
        const schema = createSchema<T, S>({
          t1: {
            fn: value => value.s1,
            validation: Validation.string().length(LENGTH)
          }
        });
        const result = morphism(schema, { s1: 'aaa' });
        const error = new ValidationError({ targetProperty: 't1', expect: `value to be length of ${LENGTH}`, value: 'aaa' });
        const message = defaultFormatter(error);
        const errors = reporter.report(result);
        expect(errors).not.toBeNull();
        if (errors) {
          expect(errors.length).toEqual(1);
          expect(errors[0]).toBe(message);
        }
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
        const error = new ValidationError({ targetProperty: 't1', expect: 'value to be typeof number', value: undefined });
        const message = defaultFormatter(error);
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
        const error = new ValidationError({ targetProperty: 't1', expect: 'value to be typeof boolean', value: 'a value' });
        const message = defaultFormatter(error);

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
