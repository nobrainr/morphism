import { Mapper } from './morphism';
import { isPromise } from './helpers';

export function decorator<Target>(mapper: Mapper<Target>) {
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
