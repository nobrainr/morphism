import { BaseValidator } from './BaseValidator';
import { isString } from '../../helpers';
import { PropertyValidationError } from '../PropertyValidationError';

export class StringValidator extends BaseValidator<string> {
  constructor() {
    super({
      name: 'string',
      expect: `value to be typeof string`,
      test: function(value) {
        const result = value;
        if (!isString(result)) {
          throw new PropertyValidationError({ value, expect: this.expect });
        }
        return result;
      }
    });
  }

  min(val: number) {
    this.addRule({
      name: 'min',
      expect: `value to be greater or equal than ${val}`,
      test: function(value) {
        if (value.length < val) {
          throw new PropertyValidationError({ value, expect: this.expect });
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
        if (value.length > val) {
          throw new PropertyValidationError({ value, expect: this.expect });
        }
        return value;
      }
    });
    return this;
  }
}
