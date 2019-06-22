import { TypeValidator } from './interfaces.validator';
import { PropertyValidationError } from '../PropertyValidationError';

export const number = Symbol('number');
type NumberValidator = TypeValidator<number, typeof number>;

export const NumberValidator: NumberValidator = {
  type: number,
  validateAndParse: function(value) {
    const result = +value;

    if (isNaN(result)) {
      throw new PropertyValidationError({ value, type: this.type });
    } else {
      return result;
    }
  }
};
