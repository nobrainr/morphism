import { StringValidator, BooleanValidator, NumberValidator } from './validators';
import { BaseValidator, Validator, Rule } from './validators/BaseValidator';
import { Constructable } from '../types';

type Validators = ReturnType<IValidation[keyof ValidatorsMap]>;
type ValidatorsKeys = keyof ValidatorsMap;
type ValidatorsMap = Omit<IValidation, 'addValidator'>;
export interface IValidation {
  string: () => StringValidator;
  number: () => NumberValidator;
  boolean: () => BooleanValidator;
  addValidator<T extends ValidatorsKeys, U extends Constructable<Validator>>(name: T, validator: U): void;
}

const handler: ProxyHandler<IValidation> = {
  get: (object, prop: ValidatorsKeys & keyof IValidation) => {
    if (prop in object) {
      return object[prop];
    } else if (validators.has(prop)) {
      return validators.get(prop);
    } else {
      throw new Error(`The validator ${prop}() does not exist. Did you forget to call Validation.addValidator(name, validator)`);
    }
  }
};

const validators = new Map<ValidatorsKeys, () => Validators>();
const Validation = new Proxy(
  {
    addValidator: (name, validator) => {
      validators.set(name, () => new validator() as any); // TODO: remove any type
    }
  } as IValidation,
  handler
);
Validation.addValidator('string', StringValidator);
Validation.addValidator('number', NumberValidator);
Validation.addValidator('boolean', BooleanValidator);

export { BaseValidator, Rule, Validation };
