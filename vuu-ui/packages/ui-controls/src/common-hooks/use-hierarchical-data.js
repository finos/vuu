import { useRef, useState } from 'react';
import { isGroupNode, isHeader } from '../utils';

const populateIndices = (nodes, results = [], idx = { value: 0 }) => {
  let skipToNextHeader = false;
  for (let node of nodes) {
    if (skipToNextHeader && !isHeader(node)) {
      continue;
    } else {
      results[idx.value] = node;
      idx.value += 1;
      skipToNextHeader = false;
      if (isHeader(node) && node.expanded === false) {
        skipToNextHeader = true;
      } else if (isGroupNode(node)) {
        if (node.expanded !== false) {
          populateIndices(node.childNodes, results, idx);
        }
      }
    }
  }
  return results;
};

//TODO return a read-only data structure
// Question: is source changes at runtime, do we lose any current state ?
export const useHierarchicalData = (source, label) => {
  // console.log(`%c[useHierarchicalData<${label}>] entry`, 'color: green; font-weight: bold;');

  const externalSource = useRef(source);
  const statefulSource = useRef(source);
  const indexPositions = useRef(populateIndices(source));
  const [, forceUpdate] = useState(null);

  // Maintain a mapping between nodes and their current index position within the rendered list.
  // This index position is liable to change with every expand/collapse operation. We require this
  // when handling keyboard events - these are List level, not listItem level, so we depend on the

  // Client needs to be careful source is not recreated inadvertently on each render
  if (source !== externalSource.current) {
    // console.log(
    //   `%cuseHierarchicalData source has changed`,
    //   'color:red;font-weight: bold;',
    //   externalSource.current,
    //   source
    // );
    externalSource.current = source;
    // we might want to try and merge existing state here ?
    statefulSource.current = source;
    indexPositions.current = populateIndices(source);
  }

  const setData = (value) => {
    statefulSource.current = value;
    indexPositions.current = populateIndices(value);
    // console.log(
    //   `data set in ${label} (${indexPositions.current.length} visible items)`,
    //   indexPositions.current.map((i) => ({ index: i.index, label: i.label }))
    // );
    forceUpdate({});
  };

  return {
    // data, // do we actually use the data anywhere
    data: statefulSource.current,
    indexPositions: indexPositions.current,
    setData
  };
};
