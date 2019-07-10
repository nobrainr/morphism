import { BaseValidator } from './BaseValidator';
import { isString } from '../../helpers';
import { PropertyValidationError } from '../PropertyValidationError';

export class StringValidator extends BaseValidator<string> {
  constructor() {
    super({
      name: 'string',
      test: function(value) {
        const result = value;
        if (!isString(result)) {
          throw new PropertyValidationError({ value, type: this.name });
        }
        return result;
      }
    });
  }

  min(val: number) {
    this.addRule({
      name: 'min',
      test: function(value) {
        if (value.length < val) {
          throw new PropertyValidationError({ value, type: this.name });
        }
        return value;
      }
    });
    return this;
  }
  max(val: number) {
    this.addRule({
      name: 'max',
      test: function(value) {
        if (value.length > val) {
          throw new PropertyValidationError({ value, type: this.name });
        }
        return value;
      }
    });
    return this;
  }
}
