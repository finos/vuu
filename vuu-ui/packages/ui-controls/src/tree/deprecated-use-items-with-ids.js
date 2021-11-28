import { useCallback, useMemo } from 'react';

const defaultExpanded = true;
// TODO default the root
export const useItemsWithIds = (sourceProp, idRoot) => {
  const mapById = useMemo(() => new Map(), []);

  const normalizeSource = useCallback(
    (nodes, indexer, path = '', results = []) => {
      if (sourceProp === undefined) {
        return;
      }
      let count = 0;
      for (let i = 0; i < nodes.length; i++) {
        const { childNodes = null, ...node } = nodes[i];
        const isLeaf = childNodes === null || childNodes.length === 0;
        const expanded = isLeaf ? undefined : defaultExpanded;
        const childPath = path ? `${path}.${i}` : `${i}`;
        const item = {
          ...node,
          id: `${idRoot}-${childPath}`,
          count: expanded === undefined ? 0 : childNodes.length,
          index: indexer.index,
          expanded
        };
        results.push(item);
        mapById.set(item.id, node);
        count += 1;
        indexer.index += 1;

        if (expanded !== undefined) {
          const [childCount, children] = normalizeSource(childNodes, indexer, childPath, []);
          item.childNodes = children;
          if (expanded === true) {
            count += childCount;
          }
        }
      }
      return [count, results];
    },
    [idRoot, mapById, sourceProp]
  );

  const [count, source] = useMemo(
    () => normalizeSource(sourceProp, { index: 0 }),
    [normalizeSource, sourceProp]
  );

  const getItemById = useCallback(
    (id) => {
      return mapById.get(id);
    },
    [mapById]
  );

  return [count, source, getItemById];
};
