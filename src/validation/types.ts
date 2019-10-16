export interface Rule<T> {
  name: string;
  expect: string;
  validate: (input: any) => any;
}
