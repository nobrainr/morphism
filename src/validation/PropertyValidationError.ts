export interface ValuePropertyValidationError {
  value: unknown;
  expect: string;
}
export class PropertyValidationError extends Error {
  value: unknown;
  expect: string;
  constructor(infos: ValuePropertyValidationError) {
    super(infos.expect);
    this.value = infos.value;
    this.expect = infos.expect;
  }
}
