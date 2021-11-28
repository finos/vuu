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

  const normalizeSource = useCallback(
    (nodes, indexer, path = '', results = []) => {
      let count = 0;
      nodes.map(createProxy).forEach((proxy, i, proxies) => {
        const isCollapsibleHeader = proxy.header && collapsibleHeaders;
        const isNonCollapsibleGroupNode = proxy.childNodes && collapsibleHeaders === false;
        const isLeaf = !proxy.childNodes || proxy.childNodes.length === 0;
        const nonCollapsible = isNonCollapsibleGroupNode || (isLeaf && !isCollapsibleHeader);
        const expanded = nonCollapsible ? undefined : defaultExpanded;
        const childPath = path ? `${path}.${i}` : `${i}`;
        const item = proxy.set({
          id: `${idRoot}-${childPath}`,
          count:
            !isNonCollapsibleGroupNode && expanded === undefined
              ? 0
              : countChildItems(proxy, proxies, i),
          index: indexer.index,
          expanded
        });
        results.push(item);

        count += 1;
        indexer.index += 1;

        // if ((isNonCollapsibleGroupNode || expanded !== undefined) && !isCollapsibleHeader) {
        if (proxy.childNodes) {
          const [childCount, children] = normalizeSource(proxy.childNodes, indexer, childPath, []);
          item.childNodes = children;
          if (expanded === true || isNonCollapsibleGroupNode) {
            count += childCount;
          }
        }
      });
      return [count, results];
    },
    [collapsibleHeaders, createProxy, defaultExpanded, idRoot]
  );

  const [count, source] = useMemo(
    () => normalizeSource(sourceProp, { index: 0 }),
    [normalizeSource, sourceProp]
  );

  return [count, source];
};
