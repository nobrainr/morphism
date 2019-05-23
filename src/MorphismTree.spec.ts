import { MophismSchemaTree, SchemaNode, NodeKind } from './MorphismTree';
import Morphism, { StrictSchema } from './morphism';

describe('Tree', () => {
  describe('Add', () => {
    it('should add a node under the root', () => {
      interface Target {
        keyA: string;
      }
      const tree = new MophismSchemaTree<Target, {}>({});
      tree.add({ action: 'keyA', propertyName: 'keyA' });

      const root: SchemaNode<Target, {}> = {
        data: { targetPropertyPath: '', propertyName: 'MorphismTreeRoot', action: null, kind: NodeKind.Root },
        parent: null,
        children: []
      };
      const result: SchemaNode<Target, {}> = {
        data: { targetPropertyPath: 'keyA', propertyName: 'keyA', action: 'keyA', kind: NodeKind.ActionString },
        parent: root,
        children: []
      };

      expect(tree.root.data).toEqual(root.data);
      expect(tree.root.parent).toEqual(root.parent);

      expect(tree.root.children[0].data.action).toEqual(result.data.action);
      expect(tree.root.children[0].data.targetPropertyPath).toEqual(result.data.targetPropertyPath);
      expect(tree.root.children[0].data.propertyName).toEqual(result.data.propertyName);
      expect(tree.root.children[0].data.kind).toEqual(result.data.kind);

      expect(tree.root.children[0].parent!.data.propertyName).toEqual(root.data.propertyName);
    });

    it('should add a node under another node', () => {
      interface Target {
        keyA: string;
      }
      const tree = new MophismSchemaTree<Target, {}>({});
      const parentTargetPropertyPath = 'keyA';
      tree.add({ action: null, propertyName: 'keyA', targetPropertyPath: parentTargetPropertyPath });
      tree.add({ action: 'keyA', propertyName: 'keyA1' }, parentTargetPropertyPath);

      const nodeKeyA: SchemaNode<Target, {}> = {
        data: { targetPropertyPath: 'keyA', propertyName: 'keyA', action: null, kind: NodeKind.Property },
        parent: null,
        children: []
      };

      const nodeKeyA1: SchemaNode<Target, {}> = {
        data: { targetPropertyPath: 'keyA.keyA1', propertyName: 'keyA1', action: 'keyA', kind: NodeKind.ActionString },
        parent: null,
        children: []
      };

      // KeyA
      expect(tree.root.children[0].data.action).toEqual(nodeKeyA.data.action);
      expect(tree.root.children[0].data.targetPropertyPath).toEqual(nodeKeyA.data.targetPropertyPath);
      expect(tree.root.children[0].data.propertyName).toEqual(nodeKeyA.data.propertyName);
      expect(tree.root.children[0].data.kind).toEqual(nodeKeyA.data.kind);

      // KeyA1
      const keyA1 = tree.root.children[0].children[0];
      expect(keyA1.data.action).toEqual(nodeKeyA1.data.action);
      expect(keyA1.data.targetPropertyPath).toEqual(nodeKeyA1.data.targetPropertyPath);
      expect(keyA1.data.propertyName).toEqual(nodeKeyA1.data.propertyName);
      expect(keyA1.data.kind).toEqual(nodeKeyA1.data.kind);
    });
  });

  describe('Parser', () => {
    it('should parse a simple morphism schema to a MorphismTree', () => {
      interface Target {
        keyA: string;
      }
      const schema: StrictSchema<Target> = { keyA: 'test' };
      const tree = new MophismSchemaTree(schema);

      const expected = {
        propertyName: 'keyA',
        targetPropertyPath: 'keyA',
        kind: NodeKind.ActionString,
        action: 'test'
      };

      let result;
      for (const node of tree.traverseBFS()) {
        const {
          data: { propertyName, targetPropertyPath, kind, action }
        } = node;
        result = { propertyName, targetPropertyPath, kind, action };
      }

      expect(result).toEqual(expected);
    });

    it('should parse a complex morphism schema to a MorphismTree', () => {
      interface Target {
        keyA: {
          keyA1: string;
        };
        keyB: {
          keyB1: {
            keyB11: string;
          };
        };
      }
      const mockAction = 'action-string';
      const schema: StrictSchema<Target> = {
        keyA: { keyA1: mockAction },
        keyB: { keyB1: { keyB11: mockAction } }
      };
      const tree = new MophismSchemaTree(schema);

      const expected = [
        {
          propertyName: 'keyA',
          targetPropertyPath: 'keyA',
          kind: NodeKind.Property,
          action: null
        },
        {
          propertyName: 'keyB',
          targetPropertyPath: 'keyB',
          kind: NodeKind.Property,
          action: null
        },
        {
          propertyName: 'keyA1',
          targetPropertyPath: 'keyA.keyA1',
          kind: NodeKind.ActionString,
          action: mockAction
        },
        {
          propertyName: 'keyB1',
          targetPropertyPath: 'keyB.keyB1',
          kind: NodeKind.Property,
          action: null
        },
        {
          propertyName: 'keyB11',
          targetPropertyPath: 'keyB.keyB1.keyB11',
          kind: NodeKind.ActionString,
          action: mockAction
        }
      ];

      let results = [];
      for (const node of tree.traverseBFS()) {
        const {
          data: { propertyName, targetPropertyPath, kind, action }
        } = node;
        results.push({ propertyName, targetPropertyPath, kind, action });
      }

      expect(results).toEqual(expected);
    });

    it('should parse an array of morphism actions in schema to a MorphismTree', () => {
      interface Target {
        keyA: [
          {
            keyA1: string;
            keyA2: string;
          },
          {
            keyB1: string;
            keyB2: string;
          }
        ];
      }

      const mockAction = 'action-string';
      const schema: StrictSchema<Target> = {
        keyA: [{ keyA1: mockAction, keyA2: mockAction }, { keyB1: mockAction, keyB2: mockAction }]
      };
      const tree = new MophismSchemaTree(schema);

      const expected = [
        {
          action: null,
          kind: 'Property',
          propertyName: 'keyA',
          targetPropertyPath: 'keyA'
        },
        {
          action: null,
          kind: 'Property',
          propertyName: '0',
          targetPropertyPath: 'keyA.0'
        },
        {
          action: null,
          kind: 'Property',
          propertyName: '1',
          targetPropertyPath: 'keyA.1'
        },
        {
          action: 'action-string',
          kind: 'ActionString',
          propertyName: 'keyA1',
          targetPropertyPath: 'keyA.0.keyA1'
        },
        {
          action: 'action-string',
          kind: 'ActionString',
          propertyName: 'keyA2',
          targetPropertyPath: 'keyA.0.keyA2'
        },
        {
          action: 'action-string',
          kind: 'ActionString',
          propertyName: 'keyB1',
          targetPropertyPath: 'keyA.1.keyB1'
        },
        {
          action: 'action-string',
          kind: 'ActionString',
          propertyName: 'keyB2',
          targetPropertyPath: 'keyA.1.keyB2'
        }
      ];

      let results = [];
      for (const node of tree.traverseBFS()) {
        const {
          data: { propertyName, targetPropertyPath, kind, action }
        } = node;
        results.push({ propertyName, targetPropertyPath, kind, action });
      }

      expect(results).toEqual(expected);
    });
  });
});
