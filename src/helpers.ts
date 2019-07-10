import { ActionSelector, ActionAggregator, ActionFunction } from './types';

/**
 * Symbol identifier used to store options on a Morphism schema. Using the `createSchema` helper to avoid using the symbol directly.
 *
 * @example
 * ```typescript
 * import { SCHEMA_OPTIONS_SYMBOL } from 'morphism';
 *
 * const options: SchemaOptions = { class: { automapping: true }, undefinedValues: { strip: true } };
 * const schema: Schema = { targetProperty: 'sourceProperty', [SCHEMA_OPTIONS_SYMBOL]: options }

 * ```
 */
export const SCHEMA_OPTIONS_SYMBOL = Symbol('SchemaOptions');

export function isActionSelector<S, R>(value: any): value is ActionSelector<S, R> {
  return isObject(value) && (value.hasOwnProperty('fn') || value.hasOwnProperty('path'));
}
export function isActionString(value: any): value is string {
  return isString(value);
}
export function isActionAggregator(value: any): value is ActionAggregator {
  return Array.isArray(value) && value.every(isActionString);
}
export function isActionFunction(value: any): value is ActionFunction {
  return isFunction(value);
}

export function isValidAction(action: any) {
  return isString(action) || isFunction(action) || isActionSelector(action) || isActionAggregator(action);
}

export const aggregator = (paths: string[], object: any) => {
  return paths.reduce((delta, path) => {
    set(delta, path, get(object, path)); // TODO: ensure set will return the mutated object
    return delta;
  }, {});
};

export function isUndefined(value: any) {
  return value === undefined;
}

export function isObject(value: any): value is object {
  const type = typeof value;
  return value != null && (type === 'object' || type === 'function');
}

export function isString(value: any): value is string {
  return typeof value === 'string' || value instanceof String;
}

export function isFunction(value: any): value is (...args: any[]) => any {
  return typeof value === 'function';
}

export function isPromise(object: any) {
  if (Promise && Promise.resolve) {
    // tslint:disable-next-line:triple-equals
    return Promise.resolve(object) == object;
  } else {
    throw new Error('Promise not supported in your environment');
  }
}
export function get(object: any, path: string) {
  path = path.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
  path = path.replace(/^\./, ''); // strip a leading dot
  const a = path.split('.');
  for (let i = 0, n = a.length; i < n; ++i) {
    const k = a[i];
    if (isObject(object) && k in object) {
      object = (object as any)[k];
    } else {
      return;
    }
  }
  return object;
}

export function zipObject(props: string[], values: any[]) {
  return props.reduce((prev, prop, i) => {
    return { ...prev, [prop]: values[i] };
  }, {});
}

// https://github.com/mariocasciaro/object-path/blob/master/index.js
function hasOwnProperty(obj: any, prop: any) {
  if (obj == null) {
    return false;
  }
  // to handle objects with null prototypes (too edge case?)
  return Object.prototype.hasOwnProperty.call(obj, prop);
}
function hasShallowProperty(obj: any, prop: any) {
  return (typeof prop === 'number' && Array.isArray(obj)) || hasOwnProperty(obj, prop);
}
function getShallowProperty(obj: any, prop: any) {
  if (hasShallowProperty(obj, prop)) {
    return obj[prop];
  }
}
export function set(obj: any, path: any, value: any, doNotReplace?: boolean): any {
  if (typeof path === 'number') {
    path = [path];
  }
  if (!path || path.length === 0) {
    return obj;
  }
  if (typeof path === 'string') {
    return set(obj, path.split('.').map(getKey), value, doNotReplace);
  }
  const currentPath = path[0];
  const currentValue = getShallowProperty(obj, currentPath);
  if (path.length === 1) {
    if (currentValue === void 0 || !doNotReplace) {
      obj[currentPath] = value;
    }
    return currentValue;
  }

  if (currentValue === void 0) {
    // check if we assume an array
    if (typeof path[1] === 'number') {
      obj[currentPath] = [];
    } else {
      obj[currentPath] = {};
    }
  }

  return set(obj[currentPath], path.slice(1), value, doNotReplace);
}

function getKey(key: any) {
  const intKey = parseInt(key);
  if (intKey.toString() === key) {
    return intKey;
  }
  return key;
}

export function isEmptyObject(obj: object) {
  for (const prop in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, prop)) {
      return false;
    }
  }
  return true;
}
