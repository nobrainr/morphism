import { ValidatorError } from './ValidatorError';
import { BaseValidator } from './BaseValidator';
export class NumberValidator extends BaseValidator<number> {
  constructor() {
    super({
      name: 'number',
      expect: 'value to be typeof number',
      test: function(value) {
        const result = +value;
        if (isNaN(result)) {
          throw new ValidatorError({ value, expect: this.expect });
        } else {
          return result;
        }
      }
    });
  }

  min(val: number) {
    this.addRule({
      name: 'min',
      expect: `value to be greater or equal than ${val}`,
      test: function(value) {
        if (value < val) {
          throw new ValidatorError({ value, expect: this.expect });
        }
        return value;
      }
    });
    return this;
  }
  max(val: number) {
    this.addRule({
      name: 'max',
      expect: `value to be less or equal than ${val}`,
      test: function(value) {
        if (value > val) {
          throw new ValidatorError({ value, expect: this.expect });
        }
        return value;
      }
    });
    return this;
  }
}
