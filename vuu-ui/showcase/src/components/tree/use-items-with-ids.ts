import { useCallback, useMemo } from 'react';

const PathSeparators = new Set(['/', '-', '.']);
// TODO where do we define or identify separators
const isPathSeparator = (char) => PathSeparators.has(char);

const isParentPath = (parentPath, childPath) =>
  childPath.startsWith(parentPath) && isPathSeparator(childPath[parentPath.length]);

export const useItemsWithIds = (
  sourceProp,
  idRoot = 'root',
  { collapsibleHeaders, defaultExpanded = false, revealSelected = false } = {}
) => {
  const countChildItems = (item, items, idx) => {
    if (item.childNodes) {
      return item.childNodes.length;
    } else if (item.header) {
      let i = idx + 1;
      let count = 0;
      while (i < items.length && !items[i].header) {
        count++;
        i++;
      }
      return count;
    } else {
      return 0;
    }
  };

  const isExpanded = useCallback(
    (path) => {
      if (Array.isArray(revealSelected)) {
        return revealSelected.some((id) => isParentPath(path, id));
      }
      return defaultExpanded;
    },
    [defaultExpanded, revealSelected]
  );

  const normalizeItems = useCallback(
    (items, indexer, level = 1, path = '', results = [], flattenedSource = []) => {
      let count = 0;
      // TODO get rid of the Proxy
      items.forEach((item, i, all) => {
        const isCollapsibleHeader = item.header && collapsibleHeaders;
        const isNonCollapsibleGroupNode = item.childNodes && collapsibleHeaders === false;
        const isLeaf = !item.childNodes || item.childNodes.length === 0;
        const nonCollapsible = isNonCollapsibleGroupNode || (isLeaf && !isCollapsibleHeader);
        const childPath = path ? `${path}.${i}` : `${i}`;
        const id = item.id ?? `${idRoot}-${childPath}`;

        const expanded = nonCollapsible ? undefined : isExpanded(id);
        //TODO dev time check - if id is provided by user, make sure
        // hierarchical pattern is consistent
        const normalisedItem = {
          ...item,
          id,
          count:
            !isNonCollapsibleGroupNode && expanded === undefined
              ? 0
              : countChildItems(item, all, i),
          index: indexer.index,
          level,
          expanded
        };
        results.push(normalisedItem);
        flattenedSource.push(items[i]);

        count += 1;
        indexer.index += 1;

        // if ((isNonCollapsibleGroupNode || expanded !== undefined) && !isCollapsibleHeader) {
        if (normalisedItem.childNodes) {
          const [childCount, children] = normalizeItems(
            normalisedItem.childNodes,
            indexer,
            level + 1,
            childPath,
            [],
            flattenedSource
          );
          normalisedItem.childNodes = children;
          if (expanded === true || isNonCollapsibleGroupNode) {
            count += childCount;
          }
        }
      });
      return [count, results, flattenedSource];
    },
    [collapsibleHeaders, idRoot, isExpanded]
  );

  const [count, sourceWithIds, flattenedSource] = useMemo(() => {
    return normalizeItems(sourceProp, { index: 0 });
  }, [normalizeItems, sourceProp]);

  const sourceItemById = useCallback(
    (id, target = sourceWithIds) => {
      const sourceWithId = target.find(
        (i) => i.id === id || (i?.childNodes?.length && isParentPath(i.id, id))
      );
      if (sourceWithId?.id === id) {
        return flattenedSource[sourceWithId.index];
      } else if (sourceWithId) {
        return sourceItemById(id, sourceWithId.childNodes);
      }
    },
    [flattenedSource, sourceWithIds]
  );

  return [count, sourceWithIds, sourceItemById];
};
