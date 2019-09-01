import { BaseValidator, Rule, Validation } from './Validation';
import { createSchema } from '../MorphismTree';
import { morphism, reporter, ValidatorError } from '../morphism';
import { ValidationError, defaultFormatter } from './reporter';

declare module './Validation' {
  interface IValidation {
    test: () => TestValidator;
  }
}
class TestValidator extends BaseValidator<Array<any>> {
  constructor() {
    super({ expect: 'value to be typeof array', name: 'array', test: value => value });
  }
  max(value: number) {
    const rule: Rule<Array<any>> = {
      expect: `length of array to be less than ${value}`,
      name: 'max',
      test: function(input) {
        if (input.length > value) {
          throw new ValidatorError({ value: input, expect: this.expect });
        }
        return input;
      }
    };
    this.addRule(rule);
    return this;
  }
}
Validation.addValidator('test', TestValidator);

describe('Validation', () => {
  it('should allow to add a custom validator', () => {
    interface S {
      s1: string[];
    }
    interface T {
      t1: string[];
    }

    const length = 2;
    const source: S = { s1: ['a', 'b', 'c'] };
    const schema = createSchema<T, S>({ t1: { path: 's1', validation: Validation.test().max(length) } });
    const result = morphism(schema, source);
    const error = new ValidationError({ targetProperty: 't1', expect: `length of array to be less than ${length}`, value: source.s1 });
    const message = defaultFormatter(error);

    const errors = reporter.report(result);
    expect(errors).not.toBeNull();
    if (errors) {
      expect(errors.length).toEqual(1);
      expect(errors[0]).toBe(message);
    }
  });
});
