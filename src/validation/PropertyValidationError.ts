export interface ValuePropertyValidationError {
  value: unknown;
  type: symbol;
}
export class PropertyValidationError extends Error {
  value: unknown;
  type: symbol;
  constructor(infos: ValuePropertyValidationError) {
    super();
    this.value = infos.value;
    this.type = infos.type;
  }
}
