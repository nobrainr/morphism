import { PropertyValidationError } from './PropertyValidationError';

export const ERRORS = Symbol('errors');

export interface ValidationError extends PropertyValidationError {
  targetProperty: string;
  value: unknown;
}

export interface ValidationErrors extends Array<ValidationError> {}

export interface Validation {
  [ERRORS]: ValidationErrors;
}

export function targetHasErrors(target: any): target is Validation {
  return target && target[ERRORS] && target[ERRORS].length > 0;
}
export function defaultFormatter(error: ValidationError) {
  const { value, targetProperty, expect } = error;
  return `Invalid value ${value} supplied at property ${targetProperty}. Expecting: ${expect}`;
}

/**
 * Formatting function called by the reporter for each errors found during the mapping towards a target.
 *
 * @interface Formatter
 */
export interface Formatter {
  (error: ValidationError): string;
}

/**
 * Class to handle reporting of errors found on a target when executing a mapping.
 *
 * @class Reporter
 */
export class Reporter {
  constructor(private formatter: Formatter = defaultFormatter) {}

  /**
   * Report a list of messages corresponding to the errors found during the transformations. Returns null when no errors has been found.
   *
   * @param {*} target
   * @returns {string[] | null}
   * @memberof Reporter
   */
  report(target: any): string[] | null {
    if (!targetHasErrors(target)) return null;

    const errors = target[ERRORS];
    return errors.map(this.formatter);
  }
}

/**
 * Singleton instance of a Reporter class.
 *
 */
export const reporter = new Reporter();
