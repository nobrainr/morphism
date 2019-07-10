import { PropertyValidationError } from '../PropertyValidationError';
import { BaseValidator } from './BaseValidator';
export class NumberValidator extends BaseValidator<number> {
  constructor() {
    super({
      name: 'number',
      test: function(value) {
        const result = +value;
        if (isNaN(result)) {
          throw new PropertyValidationError({ value, type: this.name });
        } else {
          return result;
        }
      }
    });
  }
}
