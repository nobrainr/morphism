import { Mapper, Schema, StrictSchema } from './types';
import { isPromise } from './helpers';

export function decorator<Target extends Schema<any, any> | StrictSchema<any, any>>(mapper: Mapper<Target>) {
  return (_target: any, _name: string, descriptor: PropertyDescriptor) => {
    const fn = descriptor.value;
    if (typeof fn === 'function') {
      descriptor.value = function(...args: any[]) {
        const output = fn.apply(this, args);
        if (isPromise(output)) {
          return Promise.resolve(output).then(res => mapper(res));
        }
        return mapper(output);
      };
    }

    return descriptor;
  };
}
