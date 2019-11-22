export interface ValidatorOptions {
  convert?: boolean;
}

export interface Rule<T = any> {
  name: string;
  expect: string | ((input: { value: T }) => string);
  validate: (input: { value: T }) => boolean;
}
