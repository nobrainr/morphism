const aggregator = (paths: any, object: any) => {
  return paths.reduce((delta: any, path: any) => {
    return set(delta, path, get(object, path));
  }, {});
};

function assignInWith(target: any, source: any, customizer?: (targetValue: any, sourceValue: any) => any) {
  Object.entries(source).forEach(([field, value]) => {
    if (customizer) {
      target[field] = customizer(target[field], value);
    } else {
      target[field] = value;
    }
  });
  return target;
}

function isUndefined(value: any) {
  return value === undefined;
}

function isObject(value: any) {
  const type = typeof value;
  return value != null && (type === 'object' || type === 'function');
}

function isString(value: any): value is string {
  return typeof value === 'string' || value instanceof String;
}

function isFunction(value: any): value is (...args: any[]) => any {
  return typeof value === 'function';
}
function set(object: object, path: string, value: any) {
  path = path.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
  path = path.replace(/^\./, ''); // strip a leading dot
  const paths = path.split('.');
  const lastProperty = paths.pop();
  const finalValue = paths.reduceRight(
    (finalObject, prop) => {
      return { [prop]: finalObject };
    },
    { [lastProperty]: value }
  );

  return { ...object, ...finalValue };
}
function get(object: object, path: string) {
  path = path.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
  path = path.replace(/^\./, ''); // strip a leading dot
  const a = path.split('.');
  for (let i = 0, n = a.length; i < n; ++i) {
    const k = a[i];
    if (isObject(object) && k in object) {
      object = object[k];
    } else {
      return;
    }
  }
  return object;
}

function zipObject(props: string[], values: any[]) {
  return props.reduce((prev, prop, i) => {
    return { ...prev, [prop]: values[i] };
  }, {});
}

type ActionString = string;
interface ActionFunction {
  /**
   * A Function invoked per iteration
   *
   * @param  {any} iteratee The current element to transform
   * @param  {any} source The source input to transform
   * @param  {any} target The current element transformed
   *
   */
  (iteratee: any, source: any | any[], target: any): any;
}
type ActionAggregator = string[];
type ActionSelector = { path: string | string[]; fn: (fieldValue: any, items: any[]) => any };

interface Schema {
  [targetProperty: string]: ActionString | ActionFunction | ActionAggregator | ActionSelector;
}

/**
 * Low Level transformer function.
 * Take a plain object as input and transform its values using a specified schema.
 * @param  {Object} object
 * @param  {Map<string, string> | Map<string, Function>} schema Transformation schema
 * @param  {Array} items Items to be forwarded to Actions
 * @param  {} constructed Created tranformed object of a given type
 */
function transformValuesFromObject(object: any, schema: Schema, items: any[], objectToCompute: {} | any) {
  return Object.entries(schema)
    .map(([targetProperty, action]) => {
      // iterate on every action of the schema
      if (isString(action)) {
        // Action<String>: string path => [ target: 'source' ]
        return { [targetProperty]: get(object, action) };
      } else if (isFunction(action)) {
        // Action<Function>: Free Computin - a callback called with the current object and collection [ destination: (object) => {...} ]
        return { [targetProperty]: action.call(undefined, object, items, objectToCompute) };
      } else if (Array.isArray(action)) {
        // Action<Array>: Aggregator - string paths => : [ destination: ['source1', 'source2', 'source3'] ]
        return { [targetProperty]: aggregator(action, object) };
      } else if (isObject(action)) {
        // Action<Object>: a path and a function: [ destination : { path: 'source', fn:(fieldValue, items) }]
        let result;
        try {
          let value;
          if (Array.isArray(action.path)) {
            value = aggregator(action.path, object);
          } else if (isString(action.path)) {
            value = get(object, action.path);
          }
          result = action.fn.call(undefined, value, object, items, objectToCompute);
        } catch (e) {
          e.message = `Unable to set target property [${targetProperty}].
                                \n An error occured when applying [${action.fn.name}] on property [${action.path}]
                                \n Internal error: ${e.message}`;
          throw e;
        }

        return { [targetProperty]: result };
      }
    })
    .reduce((finalObject, keyValue) => {
      const undefinedValueCheck = (destination: any, source: any) => {
        // Take the Object class value property if the incoming property is undefined
        if (isUndefined(source)) {
          if (!isUndefined(destination)) {
            return destination;
          } else {
            return; // No Black Magic Fuckery here, if the source and the destination are undefined, we don't do anything
          }
        } else {
          return source;
        }
      };
      return assignInWith(finalObject, keyValue, undefinedValueCheck);
    }, objectToCompute);
}

const transformItems = (schema: Schema, type?: any) => (input: any) => {
  if (!input) {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map(obj => {
      if (type) {
        const classObject = new type();
        return transformValuesFromObject(obj, schema, input, classObject);
      } else {
        const jsObject = {};
        return transformValuesFromObject(obj, schema, input, jsObject);
      }
    });
  } else {
    const object = input;
    if (type) {
      const classObject = new type();
      return transformValuesFromObject(object, schema, [object], classObject);
    } else {
      const jsObject = {};
      return transformValuesFromObject(object, schema, [object], jsObject);
    }
  }
};
let Morphism: {
  (schema: Schema, items?: any, type?: any): typeof type;
  register?: (type: any, schema?: Schema) => any;
  map?: (type: any, data?: any) => any;
  getMapper?: (type: any) => any;
  setMapper?: (type: any, schema: Schema) => any;
  deleteMapper?: (type: any) => any;
  mappers?: Map<any, any>;
};
/**
 * Object Literals Mapper (Curried Function)
 * Only gives a Schema as parameter will output a mapper function to pass items to.
 * Pass a Schema and items to map the input straight away.
 *
 * @param  {Map<string, any> | any} schema Configuration schema to compute data source properties
 * @param  {} items Object or Collection to be mapped
 * @param  {} type
 * @example
 *
 * const mapper = Morphism(schema);
 *
 * // => Map a single Object
 *
 * const mappedObject= mapper(sourceObject);
 *
 * // => Map a collection of Objects
 *
 * const mappedObjects = collectionOfObjects.map(mapper);
 *
 * // => Map everything straight away
 *
 *  const output = Morphism(schema, input);
 */
Morphism = (schema: Schema, items?: any, type?: any): typeof type => {
  if (items === undefined && type === undefined) {
    return transformItems(schema);
  } else if (schema && items && type) {
    let finalSchema = getSchemaForType(type, schema);
    return transformItems(finalSchema, type)(items);
  } else if (schema && items) {
    return transformItems(schema)(items);
  } else if (type && items) {
    let finalSchema = getSchemaForType(type, schema);
    return transformItems(finalSchema, type)(items);
  } else if (type) {
    let finalSchema = getSchemaForType(type, schema);
    return (futureInput: any) => {
      return transformItems(finalSchema, type)(futureInput);
    };
  }
};

const getSchemaForType = (type: any, baseSchema: any) => {
  let typeFields = Object.keys(new type());
  let defaultSchema = zipObject(typeFields, typeFields);
  let finalSchema = Object.assign(defaultSchema, baseSchema);
  return finalSchema;
};

const _registry: any = { cache: new Map() };

class MorphismRegistry {
  /**
   * Register a mapping schema for a Type aimed to be used later
   *
   * @param {Type} type Class Type to be registered
   * @param {Object} schema Configuration of how properties are computed from the source
   * @param {Object | Array } items Object or Collection to be mapped
   * @returns {Function<T>} Mapper function to be used against a data source
   */
  static register(type: any, schema?: Schema) {
    if (!type && !schema) {
      throw new Error('type paramater is required when register a mapping');
    } else if (MorphismRegistry.exists(type)) {
      throw new Error(`A mapper for ${type.name} has already been registered`);
    }
    const mapper = Morphism(schema, null, type);
    _registry.cache.set(type, mapper);
    return mapper;
  }
  /**
   *
   * @param   {Type} type
   * @param   {Array|Object} data
   * @returns {Array<type>|Object}
   * @example
   *
   * let collectionOfType = Morphism.map(Type, [object1, object2, object3]);
   */
  static map(type: any, data?: any) {
    if (!MorphismRegistry.exists(type)) {
      const mapper = MorphismRegistry.register(type);
      if (data === undefined) {
        return mapper;
      }
    }
    return MorphismRegistry.getMapper(type)(data);
  }

  static getMapper(type: any) {
    return _registry.cache.get(type);
  }

  static get mappers() {
    return _registry.cache as Map<any, any>;
  }

  static exists(type: any) {
    return _registry.cache.has(type);
  }

  static setMapper(type: any, schema: Schema) {
    if (!schema) {
      throw new Error(`The schema must be an Object. Found ${schema}`);
    } else if (!MorphismRegistry.exists(type)) {
      throw new Error(`The type ${type.name} is not registered. Register it using \`Mophism.register(${type.name}, schema)\``);
    } else {
      let fn = Morphism(schema, null, type);
      _registry.cache.set(type, fn);
      return fn;
    }
  }

  static deleteMapper(type: any) {
    return _registry.cache.delete(type);
  }
}

/** API */
Morphism.register = MorphismRegistry.register;
Morphism.map = MorphismRegistry.map;
Morphism.getMapper = MorphismRegistry.getMapper;
Morphism.setMapper = MorphismRegistry.setMapper;
Morphism.deleteMapper = MorphismRegistry.deleteMapper;
Morphism.mappers = MorphismRegistry.mappers;
/** API */

export default Morphism;
