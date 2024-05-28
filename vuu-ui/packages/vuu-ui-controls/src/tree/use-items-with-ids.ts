import { useCallback, useMemo } from "react";
import { NormalisedTreeSourceNode, TreeSourceNode } from "./treeTypes";

const PathSeparators = new Set(["/", "-", "."]);
// TODO where do we define or identify separators
const isPathSeparator = (char: string) => PathSeparators.has(char);

const isParentPath = (parentPath: string, childPath: string) =>
  childPath.startsWith(parentPath) &&
  isPathSeparator(childPath[parentPath.length]);

type Indexer = {
  index: number;
};

type SourceItemById = (
  id: string,
  target?: NormalisedTreeSourceNode[]
) => TreeSourceNode | undefined;

export const useItemsWithIds = (
  sourceProp: TreeSourceNode[],
  idRoot = "root",
  {
    collapsibleHeaders = undefined,
    defaultExpanded = false,
    revealSelected = false,
  } = {}
): [number, NormalisedTreeSourceNode[], SourceItemById] => {
  const countChildItems = (
    item: TreeSourceNode,
    items: TreeSourceNode[],
    idx: number
  ) => {
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
    (
      items: TreeSourceNode[],
      indexer: Indexer,
      level = 1,
      path = "",
      results: NormalisedTreeSourceNode[] = [],
      flattenedSource: TreeSourceNode[] = []
    ): [number, NormalisedTreeSourceNode[], TreeSourceNode[]] => {
      let count = 0;
      // TODO get rid of the Proxy
      items.forEach((item, i, all) => {
        const isCollapsibleHeader = item.header && collapsibleHeaders;
        const isNonCollapsibleGroupNode =
          item.childNodes && collapsibleHeaders === false;
        const isLeaf = !item.childNodes || item.childNodes.length === 0;
        const nonCollapsible =
          isNonCollapsibleGroupNode || (isLeaf && !isCollapsibleHeader);
        const childPath = path ? `${path}.${i}` : `${i}`;
        const id = item.id ?? `${idRoot}-${childPath}`;

        const expanded = nonCollapsible ? undefined : isExpanded(id);
        //TODO dev time check - if id is provided by user, make sure
        // hierarchical pattern is consistent
        const normalisedItem: NormalisedTreeSourceNode = {
          ...item,
          childNodes: undefined,
          id,
          count:
            !isNonCollapsibleGroupNode && expanded === undefined
              ? 0
              : countChildItems(item, all, i),
          expanded,
          index: indexer.index,
          level,
        };
        results.push(normalisedItem);
        flattenedSource.push(items[i]);

        count += 1;
        indexer.index += 1;

        // if ((isNonCollapsibleGroupNode || expanded !== undefined) && !isCollapsibleHeader) {
        if (item.childNodes) {
          const [childCount, children] = normalizeItems(
            item.childNodes,
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

  const [count, sourceWithIds, flattenedSource] = useMemo<
    [number, NormalisedTreeSourceNode[], TreeSourceNode[]]
  >(() => {
    return normalizeItems(sourceProp, { index: 0 });
  }, [normalizeItems, sourceProp]);

  const sourceItemById = useCallback<SourceItemById>(
    (id, target = sourceWithIds): TreeSourceNode | undefined => {
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
