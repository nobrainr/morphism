import { getSymbolName } from '../helpers';
import { StringValidator } from './validators';
import { BooleanValidator } from './validators';
import { NumberValidator } from './validators';
import { ValuePropertyValidationError } from './PropertyValidationError';

export const ERRORS = Symbol('errors');

export interface ValidationError {
  targetProperty: string;
  value: unknown;
  type: string;
}

export interface Errors extends Array<ValidationError> {}

export interface Validation {
  [ERRORS]: Errors;
}

export function targetHasErrors(target: any): target is Validation {
  return target && target[ERRORS] && target[ERRORS].length > 0;
}
export function defaultFormatter(error: ValidationError) {
  const { value, targetProperty, type } = error;
  return `Invalid value ${value} supplied to : [⚠️ Schema With Type] at property ${targetProperty}. Expecting type ${type}`;
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

export interface Formatter {
  (error: ValidationError): string;
}

export class Reporter {
  constructor(private formatter: Formatter = defaultFormatter) {}

  report(target: any) {
    if (!targetHasErrors(target)) return null;

    const errors = target[ERRORS];
    return errors.map(this.formatter);
  }
}

export const reporter = new Reporter();
