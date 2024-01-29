import { Actions, Schema, StrictSchema, ValidatorValidateResult } from './types';
import {
  aggregator,
  get,
  isValidAction,
  isActionString,
  isActionSelector,
  isActionAggregator,
  isActionFunction,
  isFunction,
  isString,
  isObject,
  SCHEMA_OPTIONS_SYMBOL,
  isEmptyObject,
} from './helpers';
import { ValidationError, ERRORS, targetHasErrors, ValidationErrors, reporter, Reporter } from './validation/reporter';
import { ValidatorError } from './validation/validators/ValidatorError';
import { isArray } from 'util';

export enum NodeKind {
  Root = 'Root',
  Property = 'Property',
  ActionFunction = 'ActionFunction',
  ActionAggregator = 'ActionAggregator',
  ActionString = 'ActionString',
  ActionSelector = 'ActionSelector',
}

type PreparedAction = (params: { object: any; items: any; objectToCompute: any }) => any;
interface SchemaNodeData<Target, Source> {
  propertyName: string;
  action: Actions<Target, Source> | null;
  preparedAction?: PreparedAction | null;
  kind: NodeKind;
  targetPropertyPath: string;
}
export interface SchemaNode<Target, Source> {
  data: SchemaNodeData<Target, Source>;
  parent: SchemaNode<Target, Source> | null;
  children: SchemaNode<Target, Source>[];
}

type Overwrite<T1, T2> = { [P in Exclude<keyof T1, keyof T2>]: T1[P] } & T2;

type AddNode<Target, Source> = Overwrite<
  SchemaNodeData<Target, Source>,
  {
    kind?: NodeKind;
    targetPropertyPath?: string;
    preparedAction?: (...args: any) => any;
  }
>;

/**
 * Options attached to a `Schema` or `StrictSchema`
 */
export interface SchemaOptions<Target = any> {
  /**
   * Specify how to handle ES6 Class
   * @memberof SchemaOptions
   */
  class?: {
    /**
     * Specify wether ES6 Class fields should be automapped if names on source and target match
     * @default true
     * @type {boolean}
     */
    automapping: boolean;
  };
  /**
   * Specify how to handle undefined values mapped during the transformations
   * @memberof SchemaOptions
   */
  undefinedValues?: {
    /**
     * Undefined values should be removed from the target
     * @default false
     * @type {boolean}
     */
    strip: boolean;
    /**
     * Optional callback to be executed for every undefined property on the Target
     * @function default
     */
    default?: (target: Target, propertyPath: string) => any;
  };
  /**
   * Schema validation options
   * @memberof SchemaOptions
   */
  validation?: {
    /**
     * Should throw when property validation fails
     * @default false
     * @type {boolean}
     */
    throw: boolean;
    /**
     * Custom reporter to use when throw option is set to true
     * @default false
     * @type {boolean}
     */
    reporter?: Reporter;
  };
}

/**
 * A utility function that allows defining a `StrictSchema` with extra-options e.g: how to handle `undefinedValues`
 *
 * @param {StrictSchema} schema
 * @param {SchemaOptions<Target>} [options]
 */
export function createSchema<Target = any, Source = any>(schema: StrictSchema<Target, Source>, options?: SchemaOptions<Target>) {
  if (options && !isEmptyObject(options)) (schema as any)[SCHEMA_OPTIONS_SYMBOL] = options;
  return schema;
}

export class MorphismSchemaTree<Target, Source> {
  schemaOptions: SchemaOptions<Target>;

  root: SchemaNode<Target, Source>;
  schema: Schema | StrictSchema | null;

  constructor(schema: Schema<Target, Source> | StrictSchema<Target, Source> | null) {
    this.schema = schema;
    this.schemaOptions = MorphismSchemaTree.getSchemaOptions(this.schema);

    this.root = {
      data: {
        targetPropertyPath: '',
        propertyName: 'MorphismTreeRoot',
        action: null,
        kind: NodeKind.Root,
      },
      parent: null,
      children: [],
    };
    if (schema) {
      this.parseSchema(schema);
    }
  }

  static getSchemaOptions<Target>(schema: Schema | StrictSchema | null): SchemaOptions<Target> {
    const defaultSchemaOptions: SchemaOptions<Target> = {
      class: { automapping: true },
      undefinedValues: { strip: false },
    };
    const options = schema ? (schema as any)[SCHEMA_OPTIONS_SYMBOL] : undefined;

    return { ...defaultSchemaOptions, ...options };
  }

  private parseSchema(partialSchema: Partial<Schema | StrictSchema> | string | number, actionKey?: string, parentKeyPath?: string): void {
    if (isValidAction(partialSchema) && actionKey) {
      this.add(
        {
          propertyName: actionKey,
          action: partialSchema as Actions<Target, Source>,
        },
        parentKeyPath
      );
      parentKeyPath = parentKeyPath ? `${parentKeyPath}.${actionKey}` : actionKey;
    } else {
      if (actionKey) {
        if (isObject(partialSchema) && isEmptyObject(partialSchema as any))
          throw new Error(
            `A value of a schema property can't be an empty object. Value ${JSON.stringify(partialSchema)} found for property ${actionKey}`
          );
        // check if actionKey exists to verify if not root node
        this.add(
          {
            propertyName: actionKey,
            action: partialSchema as Actions<Target, Source>,
          },
          parentKeyPath
        );
        parentKeyPath = parentKeyPath ? `${parentKeyPath}.${actionKey}` : actionKey;
      }

      if (Array.isArray(partialSchema)) {
        partialSchema.forEach((subSchema, index) => {
          this.parseSchema(subSchema, index.toString(), parentKeyPath);
        });
      } else if (isObject(partialSchema)) {
        Object.keys(partialSchema).forEach(key => {
          this.parseSchema((partialSchema as any)[key], key, parentKeyPath);
        });
      }
    }
  }

  *traverseBFS() {
    const queue: SchemaNode<Target, Source>[] = [];
    queue.push(this.root);
    while (queue.length > 0) {
      let node = queue.shift();
      if (node) {
        for (let i = 0, length = node.children.length; i < length; i++) {
          queue.push(node.children[i]);
        }
        if (node.data.kind !== NodeKind.Root) {
          yield node;
        }
      }
    }
  }

  add(data: AddNode<Target, Source>, targetPropertyPath?: string) {
    const kind = this.getActionKind(data);

    const nodeToAdd: SchemaNode<Target, Source> = {
      data: { ...data, kind, targetPropertyPath: '' },
      parent: null,
      children: [],
    };
    nodeToAdd.data.preparedAction = this.getPreparedAction(nodeToAdd.data);

    if (!targetPropertyPath) {
      nodeToAdd.parent = this.root;
      nodeToAdd.data.targetPropertyPath = nodeToAdd.data.propertyName;
      this.root.children.push(nodeToAdd);
    } else {
      for (const node of this.traverseBFS()) {
        if (node.data.targetPropertyPath === targetPropertyPath) {
          nodeToAdd.parent = node;
          nodeToAdd.data.targetPropertyPath = `${node.data.targetPropertyPath}.${nodeToAdd.data.propertyName}`;
          node.children.push(nodeToAdd);
        }
      }
    }
  }

  getActionKind(data: AddNode<Target, Source>) {
    if (isActionString(data.action)) return NodeKind.ActionString;
    if (isFunction(data.action)) return NodeKind.ActionFunction;
    if (isActionSelector(data.action)) return NodeKind.ActionSelector;
    if (isActionAggregator(data.action)) return NodeKind.ActionAggregator;
    if (isObject(data.action)) return NodeKind.Property;
    throw new Error(`The action specified for ${data.propertyName} is not supported.`);
  }

  getPreparedAction(nodeData: SchemaNodeData<Target, Source>): PreparedAction | null | undefined {
    const { propertyName: targetProperty, action, kind } = nodeData;
    // iterate on every action of the schema
    if (isActionString(action)) {
      // Action<String>: string path => [ target: 'source' ]
      return ({ object }) => get(object, action);
    } else if (isActionFunction(action)) {
      // Action<Function>: Free Computin - a callback called with the current object and collection [ destination: (object) => {...} ]
      return ({ object, items, objectToCompute }) => action.call(undefined, object, items, objectToCompute);
    } else if (isActionAggregator(action)) {
      // Action<Array>: Aggregator - string paths => : [ destination: ['source1', 'source2', 'source3'] ]
      return ({ object }) => aggregator(action, object);
    } else if (isActionSelector(action)) {
      // Action<Object>: a path and a function: [ destination : { path: 'source', fn:(fieldValue, items) }]
      return ({ object, items, objectToCompute }) => {
        let targetValue: any;
        if (action.path) {
          if (Array.isArray(action.path)) {
            targetValue = aggregator(action.path, object);
          } else if (isString(action.path)) {
            targetValue = get(object, action.path);
          }
        } else {
          targetValue = object;
        }

        if (action.fn) {
          try {
            targetValue = action.fn.call(undefined, targetValue, object, items, objectToCompute);
          } catch (e: any) {
            e.message = `Unable to set target property [${targetProperty}].
            \n An error occured when applying [${action.fn.name}] on property [${action.path}]
            \n Internal error: ${e.message}`;
            throw e;
          }
        }

        if (action.validation) {
          const validationResult = action.validation({ value: targetValue });

          this.processValidationResult(validationResult, targetProperty, objectToCompute);
          targetValue = validationResult.value;
        }
        return targetValue;
      };
    } else if (kind === NodeKind.Property) {
      return null;
    }
  }
  private processValidationResult(validationResult: ValidatorValidateResult, targetProperty: string, objectToCompute: any) {
    if (validationResult.error) {
      const error = validationResult.error;
      if (error instanceof ValidatorError) {
        this.addErrorToTarget(targetProperty, error, objectToCompute);
      } else {
        throw error;
      }
    }
  }

  private addErrorToTarget(targetProperty: string, error: ValidatorError, objectToCompute: any) {
    const validationError = new ValidationError({
      targetProperty,
      innerError: error,
    });

    if (targetHasErrors(objectToCompute)) {
      objectToCompute[ERRORS].addError(validationError);
    } else {
      if (this.schemaOptions.validation && this.schemaOptions.validation.reporter) {
        objectToCompute[ERRORS] = new ValidationErrors(this.schemaOptions.validation.reporter, objectToCompute);
      } else {
        objectToCompute[ERRORS] = new ValidationErrors(reporter, objectToCompute);
      }
      objectToCompute[ERRORS].addError(validationError);
    }
  }
}
