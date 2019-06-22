import { TypeValidator } from './interfaces.validator';
import { isString } from '../../helpers';
import { PropertyValidationError } from '../PropertyValidationError';

export const string = Symbol('string');
type StringValidator = TypeValidator<string, typeof string>;

export const StringValidator: StringValidator = {
  type: string,
  validateAndParse: function(value) {
    const result = value;
    if (!isString(result)) {
      throw new PropertyValidationError({ value, type: this.type });
    } else {
      return result;
    }
  }
};
