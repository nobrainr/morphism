import { getSymbolName } from '../helpers';

export interface ValuePropertyValidationError {
  value: unknown;
  type: symbol;
}
export class PropertyValidationError extends Error {
  value: unknown;
  type: string;
  constructor(infos: ValuePropertyValidationError) {
    super();
    this.value = infos.value;
    this.type = getSymbolName(infos.type);
  }
}
