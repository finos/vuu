import { useCallback, useMemo } from 'react';

const identity = (item) => {
  const node = typeof item === 'string' ? { label: item } : item;
  return {
    ...node,
    set(props) {
      return {
        ...this,
        ...props
      };
    }
  };
};

// TODO default the root
export const useItemsWithIds = (
  sourceProp,
  idRoot,
  { collapsibleHeaders, defaultExpanded = false, createProxy = identity } = {}
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

  // If the source data is treed, we need to save an expanded representation, so the
  // index can be used to resolve sourceItemById

  /*
    {
      header
      childNodes
      label
      [data-]expanded


    }
  */

  const normalizeSource = useCallback(
    (nodes, indexer, level = 1, path = '', results = [], flattenedSource = []) => {
      let count = 0;
      nodes.map(createProxy).forEach((proxy, i, proxies) => {
        const isCollapsibleHeader = proxy.header && collapsibleHeaders;
        const isNonCollapsibleGroupNode = proxy.childNodes && collapsibleHeaders === false;
        const isLeaf = !proxy.childNodes || proxy.childNodes.length === 0;
        const nonCollapsible = isNonCollapsibleGroupNode || (isLeaf && !isCollapsibleHeader);
        const expanded = nonCollapsible ? undefined : defaultExpanded;
        const childPath = path ? `${path}.${i}` : `${i}`;
        const item = proxy.set({
          id: proxy.id ?? `${idRoot}-${childPath}`,
          count:
            !isNonCollapsibleGroupNode && expanded === undefined
              ? 0
              : countChildItems(proxy, proxies, i),
          index: indexer.index,
          level,
          expanded
        });
        results.push(item);
        flattenedSource.push(nodes[i]);

        count += 1;
        indexer.index += 1;

        // if ((isNonCollapsibleGroupNode || expanded !== undefined) && !isCollapsibleHeader) {
        if (proxy.childNodes) {
          const [childCount, children] = normalizeSource(
            proxy.childNodes,
            indexer,
            level + 1,
            childPath,
            [],
            flattenedSource
          );
          item.childNodes = children;
          if (expanded === true || isNonCollapsibleGroupNode) {
            count += childCount;
          }
        }
      });
      return [count, results, flattenedSource];
    },
    [collapsibleHeaders, createProxy, defaultExpanded, idRoot]
  );

  const [count, sourceWithIds, flattenedSource] = useMemo(() => {
    return normalizeSource(sourceProp, { index: 0 });
  }, [normalizeSource, sourceProp]);

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

// TODO where do we define or identify separators
const isPathSeparator = (char) => char === '/' || char === '-';

const isParentPath = (parentPath, childPath) =>
  childPath.startsWith(parentPath) && isPathSeparator(childPath[parentPath.length]);
