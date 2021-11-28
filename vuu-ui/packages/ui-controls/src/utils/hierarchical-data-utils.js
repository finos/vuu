export const getNodeParentPath = ({ id }) => {
  const pos = id.lastIndexOf('-');
  const path = id.slice(pos + 1);
  const steps = path.split('.');
  if (steps.length === 1) {
    return null;
  } else {
    steps.pop();
    return `${id.slice(0, pos)}-${steps.join('.')}`;
  }
};

export const isGroupNode = (node) => node.childNodes !== undefined;
export const isCollapsibleGroupNode = (node) => isGroupNode(node) && node.expanded !== undefined;
export const isHeader = (node) => node.header === true;

const isDescendantOf = (basePath, targetPath) => {
  if (!targetPath.startsWith(basePath)) {
    return false;
  } else {
    return targetPath.charAt(basePath.length) === '.';
  }
};

export const getNodeById = (nodes, id) => {
  for (let node of nodes) {
    if (node.id === id) {
      return node;
    } else if (isDescendantOf(node.id, id)) {
      return getNodeById(node.childNodes, id);
    }
  }
};

export const getIndexOfNode = (indexPositions, node) => {
  for (let i = 0; i < indexPositions.length; i++) {
    if (indexPositions[i].id === node.id) {
      return i;
    }
  }
};

export const replaceNode = (nodes, id, props) => {
  let childNodes, newNode;
  const newNodes = nodes.map((node) => {
    if (node.id === id) {
      return (newNode = node.set(props));
      // return (newNode = {
      //   ...node,
      //   ...props
      // });
    } else if (isDescendantOf(node.id, id)) {
      [childNodes, newNode] = replaceNode(node.childNodes, id, props);
      return node.set({ childNodes });
      // return {
      //   ...node,
      //   childNodes
      // };
    } else {
      return node;
    }
  });

  return [newNodes, newNode];
};

const sum = (a, b) => a + b;

export const countVisibleDescendants = (node, force) => {
  // note: force can only be true on initial call, on recursive calls, it will be index
  return node.expanded || force === true
    ? node.childNodes.length + node.childNodes.map(countVisibleDescendants).reduce(sum)
    : 0;
};
