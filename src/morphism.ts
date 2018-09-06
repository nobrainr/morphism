import { isString, get, isFunction, isObject, zipObject, isUndefined, assignInWith, aggregator } from './helpers';

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

interface MorphismFunction {
  /**
   * Currying function that either outputs a mapping function or the transformed data.
   *
   * @example
   * import { morphism } from './morphism'
   * // => Outputs a function when only a schema is provided
   * const fn = morphism(schema);
   * const result = fn(data);
   *
   * // => Outputs the transformed data when a schema and the input data is provided
   * const result = morphism(schema, data);
   *
   * // => Outputs the transformed data as an ES6 Class Object when a schema, the input data and an ES6 Class are provided
   * const result = morphism(schema, data, Foo);
   * // result is type of Foo
   *
   * @param  {Schema} schema Configuration schema to compute data source properties
   * @param  {} items Object or Collection to be mapped
   * @param  {} type
   */
  (schema: Schema, items?: any, type?: any): typeof type;
}

const morphism: MorphismFunction = (schema: Schema, items?: any, type?: any): typeof type => {
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

interface IMorphismRegistry {
  /**
   * Register a mapping schema for a Class.
   *
   * @param {Type} type Class Type to be registered
   * @param {Object} schema Configuration of how properties are computed from the source
   *
   */
  register: (type: any, schema?: Schema) => any;
  /**
   * Transform any input in the specified Class
   *
   * @param {Type} type Class Type of the ouput Data
   * @param {Object} data Input data to transform
   *
   */
  map: (type: any, data?: any) => any;
  /**
   * Get a specific mapping function for the provided Class
   *
   * @param {Type} type Class Type of the ouput Data
   *
   */
  getMapper: (type: any) => any;
  /**
   * Set a schema for a specific Class Type
   *
   * @param {Type} type Class Type of the ouput Data
   * @param {Schema} schema Class Type of the ouput Data
   *
   */
  setMapper: (type: any, schema: Schema) => any;
  /**
   * Delete a registered schema associated to a Class
   *
   * @param type ES6 Class Type of the ouput Data
   *
   */
  deleteMapper: (type: any) => any;
  /**
   * Get the list of the mapping function registered
   *
   * @param {Type} type Class Type of the ouput Data
   *
   */
  mappers: Map<any, any>;
}

class MorphismRegistry implements IMorphismRegistry {
  private _registry: any = { cache: new Map() };

  register(type: any, schema?: Schema) {
    if (!type && !schema) {
      throw new Error('type paramater is required when register a mapping');
    } else if (this.exists(type)) {
      throw new Error(`A mapper for ${type.name} has already been registered`);
    }
    const mapper = morphism(schema, null, type);
    this._registry.cache.set(type, mapper);
    return mapper;
  }

  map(type: any, data?: any) {
    if (!this.exists(type)) {
      const mapper = this.register(type);
      if (data === undefined) {
        return mapper;
      }
    }
    return this.getMapper(type)(data);
  }

  getMapper(type: any) {
    return this._registry.cache.get(type);
  }

  get mappers() {
    return this._registry.cache as Map<any, any>;
  }

  exists(type: any) {
    return this._registry.cache.has(type);
  }

  setMapper(type: any, schema: Schema) {
    if (!schema) {
      throw new Error(`The schema must be an Object. Found ${schema}`);
    } else if (!this.exists(type)) {
      throw new Error(`The type ${type.name} is not registered. Register it using \`Mophism.register(${type.name}, schema)\``);
    } else {
      let fn = morphism(schema, null, type);
      this._registry.cache.set(type, fn);
      return fn;
    }
  }

  deleteMapper(type: any) {
    return this._registry.cache.delete(type);
  }
}

const morphismRegistry = new MorphismRegistry();
/** API */
const MorphismObject: MorphismFunction & IMorphismRegistry = morphism as any;
MorphismObject.register = (t, s) => morphismRegistry.register(t, s);
MorphismObject.map = (t, d) => morphismRegistry.map(t, d);
MorphismObject.getMapper = t => morphismRegistry.getMapper(t);
MorphismObject.setMapper = (t, s) => morphismRegistry.setMapper(t, s);
MorphismObject.deleteMapper = t => morphismRegistry.deleteMapper(t);
MorphismObject.mappers = morphismRegistry.mappers;
/** API */

export { morphism, Schema, ActionFunction, ActionString, ActionAggregator, ActionSelector };
export default MorphismObject;
