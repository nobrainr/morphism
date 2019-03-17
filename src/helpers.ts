import { ActionSelector, ActionAggregator, ActionFunction } from './types';

export function isActionSelector<S, R>(value: any): value is ActionSelector<S, R> {
  return isObject(value) && value.hasOwnProperty('fn') && value.hasOwnProperty('path');
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
    return set(delta, path, get(object, path));
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
    throw 'Promise not supported in your environment';
  }
}

export function set(object: any, path: string, value: any) {
  path = path.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
  path = path.replace(/^\./, ''); // strip a leading dot
  const paths = path.split('.');
  const lastProperty = paths.pop() as string;
  const finalValue = paths.reduceRight(
    (finalObject, prop) => {
      return { [prop]: finalObject };
    },
    { [lastProperty]: value }
  );

  return Object.assign(object, finalValue);
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
