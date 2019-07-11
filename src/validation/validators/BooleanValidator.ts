import { ValidatorError } from './ValidatorError';
import { BaseValidator } from './BaseValidator';
export class BooleanValidator extends BaseValidator<boolean> {
  constructor() {
    super({
      name: 'boolean',
      expect: 'value to be typeof boolean',
      test: function(value) {
        if (typeof value === 'boolean') {
          return value;
        } else if (/true/i.test(value)) {
          return true;
        } else if (/false/i.test(value)) {
          return false;
        } else {
          throw new ValidatorError({ value, expect: this.expect });
        }
      }
    });
  }
}
