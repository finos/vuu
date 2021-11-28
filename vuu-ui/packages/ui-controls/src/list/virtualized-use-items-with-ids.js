import React, { useMemo } from 'react';
import { ListItemGroup } from './list-item-group';
import { ListItemHeader } from './list-item-header';

export const isGroup = (child) => child.type === ListItemGroup || !!child.props['data-group'];
export const isHeader = (child) => child.type === ListItemHeader || !!child.props['data-header'];

let _id = 1;

const EMPTY_ARRAY = [];

const normalizeItems = (
  source,
  isHeader,
  isGroup,
  createItem,
  countChildren,
  collapsibleHeaders
) => {
  const results = [];
  let headers;
  let prevHeader = null;
  let childCount = 0;
  let totalCount = 0;
  let idx = 0;

  source.forEach((item) => {
    // We only need id if we have headers. Do we only need them for collapsible headers ?
    // Whats the difference between a header and a group ?
    if (isHeader(item) || isGroup(item)) {
      if (prevHeader) {
        prevHeader.count = childCount;
        childCount = 0;
      }

      if (isGroup(item)) {
        childCount = countChildren(item);
        totalCount += childCount;
      }

      if (collapsibleHeaders) {
        // Collapsible headers are focusable, so have to be included in count
        totalCount += 1;
      }

      const id = item.id ?? _id++;
      headers ??= [];
      headers.push((prevHeader = { id, idx, count: childCount, isCollapsed: false }));

      if (item.id !== id) {
        results.push(createItem(item, id));
      } else {
        results.push(item);
      }
      idx += isGroup(item) ? childCount + 1 : 1;
    } else {
      results.push(item);
      idx += 1;
      childCount += 1;
      totalCount += 1;
    }
  });

  if (prevHeader) {
    prevHeader.count = childCount;
  }

  return [results, totalCount, headers || EMPTY_ARRAY];
};

export const useItemsWithIds = (sourceProp, childrenProp, collapsibleHeaders) => {
  const isChildHeader = (child) => isHeader(child);
  const isChildGroup = (child) => isGroup(child);
  const createChildItem = (child, id) => React.cloneElement(child, { id });
  const countChildItems = (child) => React.Children.count(child.props.children);

  const isSourceHeader = (item) => item.header;
  const isSourceGroup = (item) => item.group;
  const createSourceItem = (item, id) => ({ ...item, id });
  const countSourceItems = (item) => item.childNodes.length;

  const [children, countChildren, childHeaders] = useMemo(
    () =>
      childrenProp === undefined
        ? EMPTY_ARRAY
        : normalizeItems(
            React.Children.toArray(childrenProp),
            isChildHeader,
            isChildGroup,
            createChildItem,
            countChildItems,
            collapsibleHeaders
          ),
    [childrenProp, collapsibleHeaders]
  );
  const [source, countSource, sourceHeaders] = useMemo(
    () =>
      sourceProp === undefined
        ? EMPTY_ARRAY
        : normalizeItems(
            sourceProp,
            isSourceHeader,
            isSourceGroup,
            createSourceItem,
            countSourceItems,
            collapsibleHeaders
          ),
    [collapsibleHeaders, sourceProp]
  );
  const headers = childHeaders || sourceHeaders || EMPTY_ARRAY;
  const totalCount = countChildren || countSource;
  console.log({ headers });
  return [totalCount, source, children, headers];
};
