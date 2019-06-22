import { string, StringValidator } from './string.validator';
import { boolean, BooleanValidator } from './boolean.validator';
import { number, NumberValidator } from './number.validator';

/**
 * array
 * tuple [string, number]
 * enum
 * any
 * null
 * undefined
 * object
 * */

export type BasicTypes = typeof boolean | typeof string | typeof number;
export { string, boolean, number };
export { StringValidator, BooleanValidator, NumberValidator };
