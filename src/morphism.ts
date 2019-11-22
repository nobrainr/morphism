/**
 * @module morphism
 */
import { zipObject, isUndefined, get, set, SCHEMA_OPTIONS_SYMBOL } from './helpers';
import { Schema, StrictSchema, Constructable, SourceFromSchema, Mapper, DestinationFromSchema } from './types';
import { MorphismSchemaTree, createSchema, SchemaOptions } from './MorphismTree';
import { MorphismRegistry, IMorphismRegistry } from './MorphismRegistry';
import { decorator } from './MorphismDecorator';
import { Reporter, reporter as defaultReporter, Formatter, targetHasErrors, ValidationErrors } from './validation/reporter';
import { Validation, IValidation } from './validation/Validation';
import { ValidatorError } from './validation/validators/ValidatorError';
import { Rule } from './validation/validators/types';

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
  tree: MorphismSchemaTree<Target, Source>,
  items: Source[],
  objectToCompute: Target
) {
  const options = tree.schemaOptions;
  const transformChunks = [];

  for (const node of tree.traverseBFS()) {
    const { preparedAction, targetPropertyPath } = node.data;
    if (preparedAction)
      transformChunks.push({
        targetPropertyPath,
        preparedAction: preparedAction({ object, objectToCompute, items }),
      });
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
    if (finalValue === undefined) {
      // strip undefined values
      if (options && options.undefinedValues && options.undefinedValues.strip) {
        if (options.undefinedValues.default) {
          set(finalObject, chunk.targetPropertyPath, options.undefinedValues.default(finalObject, chunk.targetPropertyPath));
        }
      } else {
        // do not strip undefined values
        set(finalObject, chunk.targetPropertyPath, finalValue);
      }
      checkIfValidationShouldThrow<Target>(options, finalObject);
      return finalObject;
    } else {
      set(finalObject, chunk.targetPropertyPath, finalValue);
      checkIfValidationShouldThrow<Target>(options, finalObject);
      return finalObject;
    }
  }, objectToCompute);
}

function checkIfValidationShouldThrow<Target>(options: SchemaOptions<Target>, finalObject: Target) {
  if (options && options.validation && options.validation.throw) {
    if (targetHasErrors(finalObject)) {
      let errors: ValidationErrors | null;
      if (options.validation.reporter) {
        const reporter = options.validation.reporter;
        errors = reporter.extractErrors(finalObject);
      } else {
        errors = defaultReporter.extractErrors(finalObject);
      }
      if (errors) {
        throw errors;
      }
    }
  }
}

function transformItems<T, TSchema extends Schema<T | {}>>(schema: TSchema, type?: Constructable<T>) {
  const options = MorphismSchemaTree.getSchemaOptions<T>(schema);
  let tree: MorphismSchemaTree<any, any>;
  if (type && options.class && options.class.automapping) {
    const finalSchema = getSchemaForClass(type, schema);
    tree = new MorphismSchemaTree(finalSchema);
  } else {
    tree = new MorphismSchemaTree(schema);
  }

  const mapper: Mapper<TSchema> = (source: any) => {
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
  };

  return mapper;
}

function getSchemaForClass<T>(type: Constructable<T>, baseSchema: Schema<T>): Schema<T> {
  let typeFields = Object.keys(new type());
  let defaultSchema = zipObject(typeFields, typeFields);
  let finalSchema = Object.assign(defaultSchema, baseSchema);
  return finalSchema;
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
function morphism<
  TSchema = Schema<DestinationFromSchema<Schema>, SourceFromSchema<Schema>>,
  Source extends SourceFromSchema<TSchema> = SourceFromSchema<TSchema>
>(schema: TSchema, data: Source[]): DestinationFromSchema<TSchema>[];

function morphism<
  TSchema = Schema<DestinationFromSchema<Schema>, SourceFromSchema<Schema>>,
  Source extends SourceFromSchema<TSchema> = SourceFromSchema<TSchema>
>(schema: TSchema, data: Source): DestinationFromSchema<TSchema>;

function morphism<TSchema = Schema<DestinationFromSchema<Schema>, SourceFromSchema<Schema>>>(schema: TSchema): Mapper<TSchema>; // morphism({}) => mapper(S) => T

function morphism<TSchema extends Schema, TDestination>(
  schema: TSchema,
  items: null,
  type: Constructable<TDestination>
): Mapper<TSchema, TDestination>; // morphism({}, null, T) => mapper(S) => T

function morphism<TSchema extends Schema, Target>(schema: TSchema, items: SourceFromSchema<TSchema>, type: Constructable<Target>): Target; // morphism({}, {}, T) => T

function morphism<Target, Source, TSchema extends Schema<Target, Source>>(
  schema: TSchema,
  items?: SourceFromSchema<TSchema> | null,
  type?: Constructable<Target>
) {
  switch (arguments.length) {
    case 1: {
      return transformItems(schema);
    }
    case 2: {
      return transformItems(schema)(items);
    }
    case 3: {
      if (type) {
        if (items !== null) return transformItems(schema, type)(items); // TODO: deprecate this option morphism(schema,null,Type) in favor of createSchema({},options={class: Type})
        return transformItems(schema, type);
      } else {
        throw new Error(`When using morphism(schema, items, type), type should be defined but value received is ${type}`);
      }
    }
  }
}

// Decorators
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

// Registry
const morphismRegistry = new MorphismRegistry();
const morphismMixin: typeof morphism & any = morphism;
morphismMixin.register = (t: any, s: any) => morphismRegistry.register(t, s);
morphismMixin.map = (t: any, d: any) => morphismRegistry.map(t, d);
morphismMixin.getMapper = (t: any) => morphismRegistry.getMapper(t);
morphismMixin.setMapper = (t: any, s: any) => morphismRegistry.setMapper(t, s);
morphismMixin.deleteMapper = (t: any) => morphismRegistry.deleteMapper(t);
morphismMixin.mappers = morphismRegistry.mappers;

const Morphism: typeof morphism & IMorphismRegistry = morphismMixin;

export {
  morphism,
  createSchema,
  Schema,
  StrictSchema,
  SchemaOptions,
  Mapper,
  SCHEMA_OPTIONS_SYMBOL,
  Reporter,
  defaultReporter as reporter,
  Formatter,
  Validation,
  Rule,
  ValidatorError,
  IValidation,
};
export default Morphism;
