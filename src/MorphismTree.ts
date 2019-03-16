import { Actions, Schema, StrictSchema } from './types';
import {
  aggregator,
  get,
  isValidAction,
  isActionString,
  isActionSelector,
  isActionAggregator,
  isActionFunction,
  isFunction,
  isString
} from './helpers';

export enum NodeKind {
  Root = 'Root',
  Property = 'Property',
  ActionFunction = 'ActionFunction',
  ActionAggregator = 'ActionAggregator',
  ActionString = 'ActionString',
  ActionSelector = 'ActionSelector'
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

export function parseSchema(schema: Schema | StrictSchema | string | number) {
  const tree = new MophismSchemaTree();
  seedTreeSchema(tree, schema);
  return tree;
}

function seedTreeSchema<Target, Source>(
  tree: MophismSchemaTree<Target, Source>,
  partialSchema: Partial<Schema | StrictSchema> | string | number,
  actionKey?: string,
  parentkey?: string
): void {
  if (isValidAction(partialSchema) && actionKey) {
    tree.add({ propertyName: actionKey, action: partialSchema as Actions<Target, Source> }, parentkey);
    return;
  } else if (actionKey && !Array.isArray(partialSchema)) {
    // check if actionKey exists to verify if not root node
    tree.add({ propertyName: actionKey, action: null }, parentkey);
  }

  Object.keys(partialSchema).forEach(key => {
    seedTreeSchema(tree, (partialSchema as any)[key], key, actionKey);
  });
}

export class MophismSchemaTree<Target, Source> {
  root: SchemaNode<Target, Source>;
  constructor() {
    this.root = {
      data: { targetPropertyPath: '', propertyName: 'MorphismTreeRoot', action: null, kind: NodeKind.Root },
      parent: null,
      children: []
    };
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
      } else {
        return;
      }
    }
  }

  add(data: AddNode<Target, Source>, targetPropertyPath?: string) {
    const kind = this.getActionKind(data.action);
    if (!kind) throw new Error(`The action specified for ${data.propertyName} is not supported.`);

    const nodeToAdd: SchemaNode<Target, Source> = {
      data: { ...data, kind, targetPropertyPath: '' },
      parent: null,
      children: []
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

  getActionKind(action: Actions<Target, Source> | null) {
    if (isActionString(action)) return NodeKind.ActionString;
    if (isFunction(action)) return NodeKind.ActionFunction;
    if (isActionSelector(action)) return NodeKind.ActionSelector;
    if (isActionAggregator(action)) return NodeKind.ActionAggregator;
    if (action === null) return NodeKind.Property;
  }

  getPreparedAction(nodeData: SchemaNodeData<Target, Source>): PreparedAction | null {
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
                                        \n An error occured when applying [${action.fn.name}] on property [${
            action.path
          }]
                                        \n Internal error: ${e.message}`;
          throw e;
        }
        return result;
      };
    } else if (kind === NodeKind.Property) {
      return null;
    } else {
      throw new Error(`The action specified for ${targetProperty} is not supported.`);
    }
  }
}
