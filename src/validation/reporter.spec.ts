import { morphism, createSchema, Reporter } from '../morphism';
import { defaultFormatter, reporter, ValidationError, Formatter } from './reporter';
import { Validation } from './Validation';
import { ValidatorError } from './validators/ValidatorError';

describe('Reporter', () => {
  describe('Formatter', () => {
    it('should format a ValidationError to human readable message', () => {
      const targetProperty = 'targetProperty';
      const value = undefined;
      const error = new ValidationError({
        targetProperty,
        innerError: new ValidatorError({
          expect: 'message',
          value,
        }),
      });
      const message = defaultFormatter(error);
      expect(message).toEqual(`Invalid value supplied at property <${targetProperty}>. Reason: ${error.innerError.expect}`);
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
        t2: { path: 's2', fn: val => val, validation: Validation.number() },
      });
      const result = morphism(schema, JSON.parse('{}'));
      const errors = reporter.report(result);
      const error1 = new ValidationError({
        targetProperty: 't1',
        innerError: new ValidatorError({
          expect: `Expected value to be a <boolean> but received <${undefined}>`,
          value: undefined,
        }),
      });
      const error2 = new ValidationError({
        targetProperty: 't2',
        innerError: new ValidatorError({
          expect: `Expected value to be a <number> but received <${undefined}>`,
          value: undefined,
        }),
      });
      const message1 = defaultFormatter(error1);
      const message2 = defaultFormatter(error2);
      expect(errors).not.toBeNull();
      if (errors) {
        expect(errors[0]).toBe(message1);
        expect(errors[1]).toBe(message2);
      }
    });

    it('should throw an exception when trying to use a rule more than once', () => {
      expect(() => {
        Validation.string()
          .max(1)
          .max(1)({ value: 'a' });
      }).toThrow('Rule max has already been used');
    });

    it('should allow to use a reporter with a custom formatter', () => {
      interface Target {
        t1: string;
      }
      const formatter: Formatter = error => {
        const { innerError, targetProperty } = error;
        return `${innerError.expect} for property ${targetProperty}`;
      };
      const reporter = new Reporter(formatter);

      const schema = createSchema<Target>({
        t1: { path: 's1', validation: Validation.string() },
      });
      const result = morphism(schema, { s1: 1234 });
      const error = new ValidationError({
        targetProperty: 't1',
        innerError: new ValidatorError({
          value: 1234,
          expect: `Expected value to be a <string> but received <${1234}>`,
        }),
      });

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
        const { innerError, targetProperty } = error;
        return `${innerError.expect} for property ${targetProperty}`;
      };
      const reporter = new Reporter(formatter);

      const schema = createSchema<Target>(
        { t1: { path: 's1', validation: Validation.string() } },
        { validation: { throw: true, reporter } }
      );

      const error = new ValidationError({
        targetProperty: 't1',
        innerError: new ValidatorError({
          value: 1234,
          expect: `Expected value to be a <string> but received <${1234}>`,
        }),
      });
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

        const schema = createSchema<T, S>({
          t1: { path: 's1', fn: val => val, validation: Validation.string() },
        });
        const result = morphism(schema, JSON.parse('{}'));
        const error = new ValidationError({
          targetProperty: 't1',
          innerError: new ValidatorError({
            expect: `Expected value to be a <string> but received <${undefined}>`,
            value: undefined,
          }),
        });
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

        const schema = createSchema<T, S>({
          t1: { fn: value => value.s1, validation: Validation.string().max(3) },
        });
        const result = morphism(schema, { s1: 'value' });
        const error = new ValidationError({
          targetProperty: 't1',
          innerError: new ValidatorError({
            expect: `Expected value to be less or equal than <3> but received <value>`,
            value: 'value',
          }),
        });
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

        const schema = createSchema<T, S>({
          t1: { fn: value => value.s1, validation: Validation.string().min(3) },
        });
        const result = morphism(schema, { s1: 'a' });
        const error = new ValidationError({
          targetProperty: 't1',
          innerError: new ValidatorError({
            expect: `Expected value to be greater or equal than <3> but received <a>`,
            value: 'a',
          }),
        });
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
              .max(3),
          },
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
            validation: Validation.string().size(LENGTH),
          },
        });
        const result = morphism(schema, { s1: 'aaa' });
        const error = new ValidationError({
          targetProperty: 't1',
          innerError: new ValidatorError({
            expect: `Expected value to be length of <${LENGTH}> but received <aaa>`,
            value: 'aaa',
          }),
        });
        const message = defaultFormatter(error);
        const errors = reporter.report(result);
        expect(errors).not.toBeNull();
        if (errors) {
          expect(errors.length).toEqual(1);
          expect(errors[0]).toBe(message);
        }
      });

      it('should report an error when string does not match specified regex', () => {
        interface S {
          s1: string;
        }
        interface T {
          t1: string;
        }

        const REGEX = /^[0-9]+$/;
        const VALUE = 'aaa';
        const schema = createSchema<T, S>({
          t1: {
            fn: value => value.s1,
            validation: Validation.string().regex(REGEX),
          },
        });
        const result = morphism(schema, { s1: VALUE });
        const error = new ValidationError({
          targetProperty: 't1',
          innerError: new ValidatorError({
            expect: `Expected value to match pattern: ${REGEX} but received <${VALUE}>`,
            value: VALUE,
          }),
        });
        const message = defaultFormatter(error);
        const errors = reporter.report(result);
        expect(errors).not.toBeNull();
        if (errors) {
          expect(errors.length).toEqual(1);
          expect(errors[0]).toBe(message);
        }
      });

      it('should report an error when string does not match alphanum rule', () => {
        interface S {
          s1: string;
        }
        interface T {
          t1: string;
        }

        const VALUE = '(*&@#$)';
        const schema = createSchema<T, S>({
          t1: {
            fn: value => value.s1,
            validation: Validation.string().alphanum(),
          },
        });
        const result = morphism(schema, { s1: VALUE });
        const error = new ValidationError({
          targetProperty: 't1',
          innerError: new ValidatorError({
            expect: `Expected value to contain only alphanumeric characters but received <${VALUE}>`,
            value: VALUE,
          }),
        });
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

        const schema = createSchema<T, S>({
          t1: { path: 's1', fn: val => val, validation: Validation.number() },
        });
        const result = morphism(schema, JSON.parse('{}'));
        const error = new ValidationError({
          targetProperty: 't1',
          innerError: new ValidatorError({
            expect: `Expected value to be a <number> but received <${undefined}>`,
            value: undefined,
          }),
        });
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

        const schema = createSchema<T, S>({
          t1: {
            path: 's1',
            fn: val => val,
            validation: Validation.number({ convert: true }),
          },
        });
        const result = morphism(schema, JSON.parse('{ "s1": "1234" }'));
        const errors = reporter.report(result);
        expect(errors).toBeNull();
        expect(result).toEqual({ t1: 1234 });
      });

      it('should report an error when number is greater than max rule', () => {
        interface S {
          s1: number;
        }
        interface T {
          t1: number;
        }

        const VALUE = 10;
        const MAX = 5;
        const schema = createSchema<T, S>({
          t1: {
            fn: value => value.s1,
            validation: Validation.number().max(MAX),
          },
        });
        const result = morphism(schema, { s1: VALUE });
        const error = new ValidationError({
          targetProperty: 't1',
          innerError: new ValidatorError({
            expect: `value to be less or equal than ${MAX}`,
            value: VALUE,
          }),
        });
        const message = defaultFormatter(error);
        const errors = reporter.report(result);
        expect(errors).not.toBeNull();
        if (errors) {
          expect(errors.length).toEqual(1);
          expect(errors[0]).toBe(message);
        }
      });

      it('should report an error when number is less than min rule', () => {
        interface S {
          s1: number;
        }
        interface T {
          t1: number;
        }

        const VALUE = 2;
        const MIN = 5;
        const schema = createSchema<T, S>({
          t1: {
            fn: value => value.s1,
            validation: Validation.number().min(MIN),
          },
        });
        const result = morphism(schema, { s1: VALUE });
        const error = new ValidationError({
          targetProperty: 't1',
          innerError: new ValidatorError({
            expect: `value to be greater or equal than ${MIN}`,
            value: VALUE,
          }),
        });
        const message = defaultFormatter(error);
        const errors = reporter.report(result);
        expect(errors).not.toBeNull();
        if (errors) {
          expect(errors.length).toEqual(1);
          expect(errors[0]).toBe(message);
        }
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

        const schema = createSchema<T, S>({
          t1: { path: 's1', fn: val => val, validation: Validation.boolean() },
        });
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

        const schema = createSchema<T, S>({
          t1: {
            path: 's1',
            fn: val => val,
            validation: Validation.boolean({ convert: true }),
          },
        });
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

        const schema = createSchema<T, S>({
          t1: {
            path: 's1',
            fn: val => val,
            validation: Validation.boolean({ convert: true }),
          },
        });
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

        const schema = createSchema<T, S>({
          t1: { path: 's1', fn: val => val, validation: Validation.boolean() },
        });
        const result = morphism(schema, JSON.parse('{ "s1": "a value" }'));
        const error = new ValidationError({
          targetProperty: 't1',
          innerError: new ValidatorError({
            expect: `Expected value to be a <boolean> but received <a value>`,
            value: 'a value',
          }),
        });
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
