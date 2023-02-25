import { EditorState } from "@codemirror/state";
import { SyntaxNode } from "@lezer/common";

export const getValue = (node: SyntaxNode, state: EditorState) =>
  state.doc.sliceString(node.from, node.to);

export const getNodeByName = (
  node: SyntaxNode,
  state: EditorState,
  nodeName = "Column"
) => {
  if (node.firstChild?.name === nodeName) {
    return getValue(node.firstChild, state);
  } else {
    let maybeColumnNode = node.prevSibling || node.parent;
    while (maybeColumnNode && maybeColumnNode.name !== nodeName) {
      maybeColumnNode = maybeColumnNode.prevSibling || maybeColumnNode.parent;
    }
    if (maybeColumnNode) {
      return getValue(maybeColumnNode, state);
    }
  }
};

export const getPreviousNode = (node: SyntaxNode) => {
  const prevNode = node.prevSibling;
  console.log(`prevNode ${prevNode?.name}`);
  return prevNode;
};

export const getNamedParentNode = (node: SyntaxNode) => {
  let maybeParent = node.parent;
  while (maybeParent && maybeParent.name === "⚠") {
    maybeParent = maybeParent.parent;
  }
  return maybeParent;
};

export const getPreviousNamedNode = (node: SyntaxNode) => {
  let maybeParent = node.prevSibling;
  while (maybeParent && maybeParent.name === "⚠") {
    maybeParent = maybeParent.prevSibling;
  }
  return maybeParent;
};
