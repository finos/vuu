import { useMemo, useState } from 'react';

const isGroupNode = (node) => node.expanded !== undefined;

const populateIndices = (nodes, results = [], idx = { value: 0 }) => {
  for (let node of nodes) {
    results[idx.value] = node;
    idx.value += 1;
    if (isGroupNode(node)) {
      if (node.expanded) {
        populateIndices(node.childNodes, results, idx);
      }
    }
  }
  return results;
};

//TODO return a read-only data structure
export const useHierarchicalData = (source) => {
  const [data, setData] = useState(source);
  // Maintain a mapping between nodes and their current index position within the rendered list.
  // This index position is liable to change with every expand/collapse operation. We require this
  // when handling keyboard events - these are List level, not listItem level, so we depend on the
  // highlightedIdx to identify the interactive listItem.
  const indexPositions = useMemo(() => populateIndices(data), [data]);
  return {
    data,
    setData,
    indexPositions
  };
};
