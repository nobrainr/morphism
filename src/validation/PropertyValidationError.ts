export interface ValuePropertyValidationError {
  value: unknown;
  type: string;
}
export class PropertyValidationError extends Error {
  value: unknown;
  type: string;
  constructor(infos: ValuePropertyValidationError) {
    super();
    this.value = infos.value;
    this.type = infos.type;
  }
}
