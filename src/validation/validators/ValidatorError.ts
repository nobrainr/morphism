export interface ValidatorErrorInfos {
  value: unknown;
  expect: string;
}
export class ValidatorError extends Error {
  value: unknown;
  expect: string;
  constructor(infos: ValidatorErrorInfos) {
    super(infos.expect);
    this.value = infos.value;
    this.expect = infos.expect;
  }
}
