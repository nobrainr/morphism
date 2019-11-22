import { StringValidator, BooleanValidator, NumberValidator } from './validators';

type ValidatorsMap = Omit<IValidation, 'addValidator'>;
type Validators = IValidation[keyof ValidatorsMap];
type ValidatorsKeys = keyof ValidatorsMap;

export interface IValidation {
  string: typeof StringValidator;
  number: typeof NumberValidator;
  boolean: typeof BooleanValidator;
  addValidator<T extends ValidatorsKeys, U extends Validators>(name: T, validator: U): void;
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
  },
};

const validators = new Map<ValidatorsKeys, Validators>();
const Validation = new Proxy(
  {
    addValidator: (name, validator) => {
      validators.set(name, validator);
    },
  } as IValidation,
  handler
);
Validation.addValidator('string', StringValidator);
Validation.addValidator('number', NumberValidator);
Validation.addValidator('boolean', BooleanValidator);

export { Validation };
