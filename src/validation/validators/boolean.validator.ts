import { TypeValidator } from './interfaces.validator';
import { PropertyValidationError } from '../PropertyValidationError';

export const boolean = Symbol('boolean');
type BooleanValidator = TypeValidator<boolean, typeof boolean>;

export const BooleanValidator: BooleanValidator = {
  type: boolean,
  validateAndParse: function(value) {
    if (typeof value === 'boolean') {
      return value;
    } else if (/true/i.test(value)) {
      return true;
    } else if (/false/i.test(value)) {
      return false;
    } else {
      throw new PropertyValidationError({ value, type: this.type });
    }
  }
};
