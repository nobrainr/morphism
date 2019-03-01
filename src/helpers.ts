export const aggregator = (paths: any, object: any) => {
  return paths.reduce((delta: any, path: any) => {
    return set(delta, path, get(object, path));
  }, {});
};

export function assignInWith(target: any, source: any, customizer?: (targetValue: any, sourceValue: any) => any) {
  Object.entries(source).forEach(([field, value]) => {
    if (customizer) {
      target[field] = customizer(target[field], value);
    } else {
      target[field] = value;
    }
  });
  return target;
}

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
export function set(object: object, path: string, value: any) {
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

  return { ...object, ...finalValue };
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
