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

const PathSeparators = new Set(['/', '-', '.']);
// TODO where do we define or identify separators
const isPathSeparator = (char) => PathSeparators.has(char);

const isParentPath = (parentPath, childPath) =>
  childPath.startsWith(parentPath) && isPathSeparator(childPath[parentPath.length]);

export const useItemsWithIds = (
  sourceProp,
  idRoot = 'root',
  {
    collapsibleHeaders,
    defaultExpanded = false,
    createProxy = identity,
    revealSelected = false
  } = {}
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

  const normalizeSource = useCallback(
    (nodes, indexer, level = 1, path = '', results = [], flattenedSource = []) => {
      let count = 0;
      // TODO get rid of the Proxy
      nodes.map(createProxy).forEach((proxy, i, proxies) => {
        const isCollapsibleHeader = proxy.header && collapsibleHeaders;
        const isNonCollapsibleGroupNode = proxy.childNodes && collapsibleHeaders === false;
        const isLeaf = !proxy.childNodes || proxy.childNodes.length === 0;
        const nonCollapsible = isNonCollapsibleGroupNode || (isLeaf && !isCollapsibleHeader);
        const childPath = path ? `${path}.${i}` : `${i}`;
        const id = proxy.id ?? `${idRoot}-${childPath}`;

        const expanded = nonCollapsible ? undefined : isExpanded(id);
        //TODO dev time check - if id is provided by user, make sure
        // hierarchical pattern is consistent
        const item = proxy.set({
          id,
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
