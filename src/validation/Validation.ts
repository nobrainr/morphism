import { StringValidator, BooleanValidator, NumberValidator } from './validators';

export const Validation = {
  string: () => new StringValidator(),
  number: () => new NumberValidator(),
  boolean: () => new BooleanValidator()
};
