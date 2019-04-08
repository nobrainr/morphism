import { Constructable, Schema, Mapper } from './types';
import { morphism } from './morphism';

export interface IMorphismRegistry {
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
  map<Target>(type: Constructable<Target>): Mapper<Schema, Target>;
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
