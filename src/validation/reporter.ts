import { ValidatorError } from '../morphism';

export const ERRORS = Symbol('errors');

export class ValidationError extends Error {
  targetProperty: string;
  innerError: ValidatorError;
  constructor(infos: { targetProperty: string; innerError: ValidatorError }) {
    super(`Invalid value supplied at property <${infos.targetProperty}>.`);
    this.innerError = infos.innerError;
  }
}

export class ValidationErrors extends Error {
  errors: Set<ValidationError>;
  reporter: Reporter;
  target: unknown;
  constructor(reporter: Reporter, target: unknown) {
    super();
    this.errors = new Set<ValidationError>();
    this.reporter = reporter;
    this.target = target;
  }
  addError(error: ValidationError) {
    this.errors.add(error);
    const errors = this.reporter.report(this.target);
    if (errors) {
      this.message = errors.join('\n');
    }
  }
}

export interface Validation {
  [ERRORS]: ValidationErrors;
}

export function targetHasErrors(target: any): target is Validation {
  return target && target[ERRORS] && target[ERRORS].errors.size > 0;
}
export function defaultFormatter(error: ValidationError) {
  const { message, innerError } = error;
  return `${message} Reason: ${innerError.message}`;
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
    const validationErrors = this.extractErrors(target);

    if (!validationErrors) return null;
    return [...validationErrors.errors.values()].map(this.formatter);
  }

  extractErrors(target: any) {
    if (!targetHasErrors(target)) return null;
    return target[ERRORS];
  }
}

/**
 * Singleton instance of a Reporter class.
 *
 */
export const reporter = new Reporter();
