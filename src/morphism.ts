/**
 * @module morphism
 */
import { zipObject, isUndefined, set, get } from './helpers';
import { Schema, StrictSchema } from './types';
import { MophismSchemaTree, parseSchema } from './MorphismTree';

/**
 * Low Level transformer function.
 * Take a plain object as input and transform its values using a specified schema.
 * @param  {Object} object
 * @param  {Map<string, string> | Map<string, Function>} schema Transformation schema
 * @param  {Array} items Items to be forwarded to Actions
 * @param  {} objectToCompute Created tranformed object of a given type
 */
function transformValuesFromObject<Source, Target>(
  object: Source,
  tree: MophismSchemaTree<Target, Source>,
  items: Source[],
  objectToCompute: Target
) {
  const transformChunks = [];
  for (const node of tree.traverseBFS()) {
    const { preparedAction, targetPropertyPath } = node.data;
    if (preparedAction)
      transformChunks.push({ targetPropertyPath, preparedAction: preparedAction({ object, objectToCompute, items }) });
  }

  return transformChunks.reduce((finalObject, chunk) => {
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

    const finalValue = undefinedValueCheck(get(finalObject, chunk.targetPropertyPath), chunk.preparedAction);
    return set(finalObject, chunk.targetPropertyPath, finalValue);
  }, objectToCompute);
}
interface Constructable<T> {
  new (...args: any[]): T;
}

function transformItems<T, TSchema extends Schema<T | {}>>(schema: TSchema, type?: Constructable<T>) {
  const tree = parseSchema(schema);

  function mapper(source: any) {
    if (!source) {
      return source;
    }
    if (Array.isArray(source)) {
      return source.map(obj => {
        if (type) {
          const classObject = new type();
          return transformValuesFromObject(obj, tree, source, classObject);
        } else {
          const jsObject = {};
          return transformValuesFromObject(obj, tree, source, jsObject);
        }
      });
    } else {
      const object = source;
      if (type) {
        const classObject = new type();
        return transformValuesFromObject<any, T>(object, tree, [object], classObject);
      } else {
        const jsObject = {};
        return transformValuesFromObject(object, tree, [object], jsObject);
      }
    }
  }

  return mapper;
}

function getSchemaForType<T>(type: Constructable<T>, baseSchema: Schema<T>): Schema<T> {
  let typeFields = Object.keys(new type());
  let defaultSchema = zipObject(typeFields, typeFields);
  let finalSchema = Object.assign(defaultSchema, baseSchema);
  return finalSchema;
}

type SourceFromSchema<T> = T extends StrictSchema<unknown, infer U> | Schema<unknown, infer U> ? U : never;
type DestinationFromSchema<T> = T extends StrictSchema<infer U> | Schema<infer U> ? U : never;

type ResultItem<TSchema extends Schema> = { [P in keyof TSchema]: DestinationFromSchema<TSchema>[P] };
export interface Mapper<TSchema extends Schema | StrictSchema, TResult = ResultItem<TSchema>> {
  (data: SourceFromSchema<TSchema>[]): TResult[];
  (data: SourceFromSchema<TSchema>): TResult;
}

/**
 * Currying function that either outputs a mapping function or the transformed data.
 *
 * @example
 * ```js
 *
  // => Outputs a function when only a schema is provided
  const fn = morphism(schema);
  const result = fn(data);

  // => Outputs the transformed data when a schema and the input data is provided
  const result = morphism(schema, data);

  // => Outputs the transformed data as an ES6 Class Object when a schema, the input data and an ES6 Class are provided
  const result = morphism(schema, data, Foo);
  // result is type of Foo
 * ```
 * @param  {Schema} schema Structure-preserving object from a source data towards a target data
 * @param  {} items Object or Collection to be mapped
 * @param  {} type
 *
 */
export function morphism<
  Destination,
  Source = any,
  TSchema extends Schema<Destination, Source> = Schema<Destination, Source>
>(schema: TSchema, data: Source[]): ResultItem<TSchema>[];
export function morphism<
  Destination,
  Source = any,
  TSchema extends Schema<Destination, Source> = Schema<Destination, Source>
>(schema: TSchema, data: Source): ResultItem<TSchema>;

export function morphism<
  Destination,
  Source = any,
  TSchema extends Schema<Destination, Source> = Schema<Destination, Source>
>(schema: TSchema): Mapper<TSchema>; // morphism({}) => mapper(S) => T

export function morphism<TSchema extends Schema, TDestination>(
  schema: TSchema,
  items: SourceFromSchema<TSchema> | null,
  type: Constructable<TDestination>
): Mapper<TSchema, TDestination>; // morphism({}, null, T) => mapper(S) => T

export function morphism<TSchema extends Schema, Target>(
  schema: TSchema,
  items: SourceFromSchema<TSchema>,
  type: Constructable<Target>
): Target; // morphism({}, {}, T) => T

export function morphism<Target, Source, TSchema extends Schema<Target, Source>>(
  schema: TSchema,
  items?: SourceFromSchema<TSchema> | null,
  type?: Constructable<Target>
) {
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
}

interface IMorphismRegistry {
  /**
   * Register a mapping schema for a Class.
   *
   * @param type Class Type to be registered
   * @param schema Structure-preserving object from a source data towards a target data.
   *
   */
  register<Target>(type: Constructable<Target>): Mapper<Schema<Target>, Target>;
  register<Target, TSchema>(type: Constructable<Target>, schema?: TSchema): Mapper<TSchema, Target>;

  /**
   * Transform any input in the specified Class
   *
   * @param {Type} type Class Type of the ouput Data
   * @param {Object} data Input data to transform
   *
   */
  map<Target>(type: Target): Mapper<Schema, Target>;
  map<Target, Source>(type: Constructable<Target>, data: Source[]): Target[];
  map<Target, Source>(type: Constructable<Target>, data: Source): Target;
  /**
   * Get a specific mapping function for the provided Class
   *
   * @param {Type} type Class Type of the ouput Data
   *
   */
  getMapper<Target>(type: Constructable<Target>): Mapper<Schema, Target>;
  /**
   * Set a schema for a specific Class Type
   *
   * @param {Type} type Class Type of the ouput Data
   * @param {Schema} schema Class Type of the ouput Data
   *
   */
  setMapper<Target, TSchema extends Schema<Target>>(type: Constructable<Target>, schema: TSchema): Mapper<any, Target>;
  /**
   * Delete a registered schema associated to a Class
   *
   * @param type ES6 Class Type of the ouput Data
   *
   */
  deleteMapper<Target>(type: Constructable<Target>): any;
  /**
   * Check if a schema has already been registered for this type
   *
   * @param {*} type
   */
  exists<Target>(type: Target): boolean;
  /**
   * Get the list of the mapping functions registered
   *
   * @param {Type} type Class Type of the ouput Data
   *
   */
  mappers: Map<any, any>;
}

export class MorphismRegistry implements IMorphismRegistry {
  private _registry: any = null;
  /**
   *Creates an instance of MorphismRegistry.
   * @param {Map<any, any>} cache Cache implementation to store the mapping functions.
   */
  constructor(cache?: Map<any, any> | WeakMap<any, any>) {
    if (!cache) {
      this._registry = { cache: new Map() };
    } else {
      this._registry = cache;
    }
  }

  /**
   * Register a mapping schema for a Class.
   *
   * @param type Class Type to be registered
   * @param schema Structure-preserving object from a source data towards a target data.
   *
   */
  register<Target, TSchema>(type: Constructable<Target>, schema?: TSchema) {
    if (!type && !schema) {
      throw new Error('type paramater is required when you register a mapping');
    } else if (this.exists(type)) {
      throw new Error(`A mapper for ${type.name} has already been registered`);
    }
    let mapper;
    if (schema) {
      mapper = morphism(schema, null, type);
    } else {
      mapper = morphism({}, null, type);
    }
    this._registry.cache.set(type, mapper);
    return mapper;
  }
  /**
   * Transform any input in the specified Class
   *
   * @param {Type} type Class Type of the ouput Data
   * @param {Object} data Input data to transform
   *
   */
  map(type: any, data?: any) {
    if (!this.exists(type)) {
      const mapper = this.register(type);
      if (data === undefined) {
        return mapper;
      }
    }
    return this.getMapper(type)(data);
  }
  /**
   * Get a specific mapping function for the provided Class
   *
   * @param {Type} type Class Type of the ouput Data
   *
   */
  getMapper<Target>(type: Constructable<Target>) {
    return this._registry.cache.get(type);
  }
  /**
   * Set a schema for a specific Class Type
   *
   * @param {Type} type Class Type of the ouput Data
   * @param {Schema} schema Class Type of the ouput Data
   *
   */
  setMapper<Target>(type: Constructable<Target>, schema: Schema<Target>) {
    if (!schema) {
      throw new Error(`The schema must be an Object. Found ${schema}`);
    } else if (!this.exists(type)) {
      throw new Error(
        `The type ${type.name} is not registered. Register it using \`Mophism.register(${type.name}, schema)\``
      );
    } else {
      let fn = morphism(schema, null, type);
      this._registry.cache.set(type, fn);
      return fn;
    }
  }

  /**
   * Delete a registered schema associated to a Class
   *
   * @param type ES6 Class Type of the ouput Data
   *
   */
  deleteMapper(type: any) {
    return this._registry.cache.delete(type);
  }

  /**
   * Check if a schema has already been registered for this type
   *
   * @param {*} type
   */
  exists(type: any) {
    return this._registry.cache.has(type);
  }
  /**
   * Get the list of the mapping functions registered
   *
   * @param {Type} type Class Type of the ouput Data
   *
   */
  get mappers() {
    return this._registry.cache as Map<any, any>;
  }
}

function decorator<Target>(mapper: Mapper<Target>) {
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
function isPromise(object: any) {
  if (Promise && Promise.resolve) {
    // tslint:disable-next-line:triple-equals
    return Promise.resolve(object) == object;
  } else {
    throw 'Promise not supported in your environment';
  }
}

/**
 * Function Decorator transforming the return value of the targeted Function using the provided Schema and/or Type
 *
 * @param {Schema<Target>} schema Structure-preserving object from a source data towards a target data
 * @param {Constructable<Target>} [type] Target Class Type
 */
export function morph<Target>(schema: Schema<Target>, type?: Constructable<Target>) {
  const mapper = transformItems(schema, type);
  return decorator(mapper);
}
/**
 * Function Decorator transforming the return value of the targeted Function to JS Object(s) using the provided Schema
 *
 * @param {StrictSchema<Target>} schema Structure-preserving object from a source data towards a target data
 */
export function toJSObject<Target>(schema: StrictSchema<Target>) {
  const mapper = transformItems(schema);
  return decorator(mapper);
}
/**
 * Function Decorator transforming the return value of the targeted Function using the provided Schema and Class Type
 *
 * @param {Schema<Target>} schema Structure-preserving object from a source data towards a target data
 * @param {Constructable<Target>} [type] Target Class Type
 */
export function toClassObject<Target>(schema: Schema<Target>, type: Constructable<Target>) {
  const mapper = transformItems(schema, type);
  return decorator(mapper);
}

const morphismRegistry = new MorphismRegistry();
const morphismMixin: typeof morphism & any = morphism;
morphismMixin.register = (t: any, s: any) => morphismRegistry.register(t, s);
morphismMixin.map = (t: any, d: any) => morphismRegistry.map(t, d);
morphismMixin.getMapper = (t: any) => morphismRegistry.getMapper(t);
morphismMixin.setMapper = (t: any, s: any) => morphismRegistry.setMapper(t, s);
morphismMixin.deleteMapper = (t: any) => morphismRegistry.deleteMapper(t);
morphismMixin.mappers = morphismRegistry.mappers;

const Morphism: typeof morphism & IMorphismRegistry = morphismMixin;

export { Schema, StrictSchema };
export default Morphism;
