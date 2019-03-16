import { MophismSchemaTree, SchemaNode, NodeKind } from './MorphismTree';

describe('Morphism Tree', () => {
  it('should add a node under the root', () => {
    interface Target {
      keyA: string;
    }
    const tree = new MophismSchemaTree<Target, {}>();
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
    const tree = new MophismSchemaTree<Target, {}>();
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
