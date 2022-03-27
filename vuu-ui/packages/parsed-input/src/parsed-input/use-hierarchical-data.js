import { useRef, useState } from 'react';
// import { isGroupNode, isHeader } from '../utils';

const LIST_COMPLETE = {
  id: 'end-of-list',
  value: ']',
  completion: ']',
  displayValue: 'My list is complete',
  isListItem: true
};

const sortSelectedSuggestions = (suggestions, isMultiSelect) => {
  return isMultiSelect
    ? suggestions
        .slice()
        .sort(({ value: v1, isSelected: sel1 }, { value: v2, isSelected: sel2 }) => {
          const s1 = sel1 ? 1 : 0;
          const s2 = sel2 ? 1 : 0;

          if (s1 === s2) {
            if (v1 === ']') {
              return -1;
            } else if (v2 === ']') {
              return 0;
            } else if (v1 > v2) {
              return 0;
            } else {
              return -1;
            }
          } else {
            return s2 - s1;
          }
        })
    : suggestions;
};

const populateIndices = (nodes, options, results = [], idx = { value: 0 }) => {
  const { isMultiSelect } = options;
  // let skipToNextHeader = false;
  for (let node of nodes) {
    // if (skipToNextHeader && !isHeader(node)) {
    //   continue;
    // } else {
    results[idx.value] = node;
    idx.value += 1;
    // skipToNextHeader = false;
    // if (isHeader(node) && node.expanded === false) {
    //   skipToNextHeader = true;
    // } else if (isGroupNode(node)) {
    // if (node.expanded !== false) {
    //   populateIndices(node.childNodes, results, idx);
    // }
    // }
    // }
  }

  if (isMultiSelect && results.some((item) => item.isSelected)) {
    results.push(LIST_COMPLETE);
  }

  return sortSelectedSuggestions(results, isMultiSelect);
};

//TODO return a read-only data structure
// Question: is source changes at runtime, do we lose any current state ?
export const useHierarchicalData = (source, options) => {
  // console.log(`%c[useHierarchicalData<${label}>] entry`, 'color: green; font-weight: bold;');

  const externalSource = useRef(source);
  const statefulSource = useRef(source);
  const indexPositions = useRef(populateIndices(source, options));
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
    indexPositions.current = populateIndices(source, options);
  }

  const setData = (value) => {
    statefulSource.current = value;
    indexPositions.current = populateIndices(value, options);
    forceUpdate({});
  };

  return {
    indexPositions: indexPositions.current,
    setData
  };
};
