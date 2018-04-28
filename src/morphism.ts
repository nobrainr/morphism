import { assignInWith, set, get, mapValues, isFunction, isString, zipObject, memoize, MapCache } from 'lodash';

const aggregator = (paths: any, object: any) => {
  return paths.reduce((delta: any, path: any) => {
    return set(delta, path, get(object, path));
  }, {});
};

function isUndefined(value: any) {
  return value === undefined;
}

function isObject(value: any) {
  const type = typeof value;
  return value != null && (type === 'object' || type === 'function');
}

export interface Schema {
  [targetProperty: string]:
    | string
    | ((iteratee: object | object[], source: object | object[], target: any) => any)
    | string[]
    | { path: string | string[]; fn: (fieldValue: object | object[], items: object | object[]) => any };
}

/**
 * Low Level transformer function.
 * Take a plain object as input and transform its values using a specified schema.
 * @param  {Object} object
 * @param  {Map<string, string> | Map<string, Function>} schema Transformation schema
 * @param  {Array} items Items to be forwarded to Actions
 * @param  {} constructed Created tranformed object of a given type
 */
function transformValuesFromObject(object: any, schema: Schema, items: any[], constructed: any) {
  return mapValues(schema, (action, targetProperty) => {
    // iterate on every action of the schema
    if (isString(action)) {
      // Action<String>: string path => [ target: 'source' ]
      return get(object, action);
    } else if (isFunction(action)) {
      // Action<Function>: Free Computin - a callback called with the current object and collection [ destination: (object) => {...} ]
      return action.call(undefined, object, items, constructed);
    } else if (Array.isArray(action)) {
      // Action<Array>: Aggregator - string paths => : [ destination: ['source1', 'source2', 'source3'] ]
      return aggregator(action, object);
    } else if (isObject(action)) {
      // Action<Object>: a path and a function: [ destination : { path: 'source', fn:(fieldValue, items) }]
      let value;
      if (Array.isArray(action.path)) {
        value = aggregator(action.path, object);
      } else if (isString(action.path)) {
        value = get(object, action.path);
      }
      let result;
      try {
        result = action.fn.call(undefined, value, object, items, constructed);
      } catch (e) {
        e.message = `Unable to set target property [${targetProperty}].
                                \n An error occured when applying [${action.fn.name}] on property [${action.path}]
                                \n Internal error: ${e.message}`;
        throw e;
      }

      return result;
    }
  });
}

const transformItems = (schema: Schema, customizer: any, constructed: any) => (input: any) => {
  if (!input) {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map(obj => {
      if (customizer) {
        return customizer(transformValuesFromObject(obj, schema, input, constructed));
      } else {
        return transformValuesFromObject(obj, schema, input, null);
      }
    });
  } else {
    const object = input;
    if (customizer) {
      return customizer(transformValuesFromObject(object, schema, [object], constructed));
    } else {
      return transformValuesFromObject(object, schema, [object], null);
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
  mappers?: MapCache;
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
  let constructed: typeof type = null;

  if (type) {
    constructed = new type();
  }

  const customizer = (data: any) => {
    const undefinedValueCheck = (destination: any, source: any) => {
      if (isUndefined(source)) return destination;
    };
    return assignInWith(constructed, data, undefinedValueCheck);
  };
  if (items === undefined && type === undefined) {
    return transformItems(schema, null, null);
  } else if (schema && items && type) {
    return transformItems(schema, customizer, constructed)(items);
  } else if (schema && items) {
    return transformItems(schema, null, null)(items);
  } else if (type && items) {
    let finalSchema = getSchemaForType(type, schema);
    return transformItems(finalSchema, customizer, constructed)(items);
  } else if (type) {
    let finalSchema = getSchemaForType(type, schema);
    return (futureInput: any) => {
      return transformItems(finalSchema, customizer, constructed)(futureInput);
    };
  }
};

const getSchemaForType = (type: any, baseSchema: any) => {
  let typeFields = Object.keys(new type());
  let defaultSchema = zipObject(typeFields, typeFields);
  let finalSchema = Object.assign(defaultSchema, baseSchema);
  return finalSchema;
};
/**
 * Type Mapper Factory
 * @param {type} type Class Type to be registered
 * @param {Object} schema Configuration of how properties are computed from the source
 * @param {Object | Array } items Object or Collection to be mapped
 */
function factory(type: any, schema?: any, items?: any) {
  let finalSchema = getSchemaForType(type, schema);

  return Morphism(finalSchema, items, type);
}

// memoize.Cache = WeakMap;
const _registry = memoize(factory);

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
    /**
     * @param {Object | Array } items Object or Collection to be mapped
     */
    return _registry(type, schema); // Store the result of the executed function in a WeakMap cache object
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
    return _registry(type)(data);
  }

  static getMapper(type: any) {
    return _registry.cache.get(type);
  }

  static get mappers() {
    return _registry.cache;
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
      let fn = factory(type, schema);
      _registry.cache.set(type, fn);
      return _registry(type);
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
