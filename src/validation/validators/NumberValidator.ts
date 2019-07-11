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
}
