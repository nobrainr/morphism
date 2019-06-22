import { getSymbolName } from '../helpers';
import { StringValidator } from './validators';
import { BooleanValidator } from './validators';
import { NumberValidator } from './validators';
import { ValuePropertyValidationError } from './PropertyValidationError';

export const ERRORS = Symbol('errors');

export interface ValidationError extends ValuePropertyValidationError {
  targetProperty: string;
}

export interface Errors extends Array<ValidationError> {}

export interface Validation {
  [ERRORS]: Errors;
}

export function targetContainsErrors(target: any): target is Validation {
  return target && target[ERRORS] && target[ERRORS].length > 0;
}

export function formatter(error: ValidationError) {
  const { value, targetProperty, type } = error;
  return `Invalid value ${value} supplied to : [⚠️ Schema With Type] at property ${targetProperty}. Expecting type ${getSymbolName(type)}`;
}
export function reporter(target: any) {
  if (!targetContainsErrors(target)) return [];

  const errors = target[ERRORS];
  return errors.map(formatter);
}

export function parse(value: any, type: symbol) {
  if (type === StringValidator.type) {
    return StringValidator.validateAndParse(value);
  } else if (type === NumberValidator.type) {
    return NumberValidator.validateAndParse(value);
  } else if (type === BooleanValidator.type) {
    return BooleanValidator.validateAndParse(value);
  }
}
