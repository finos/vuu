import React from 'react';
import { ListItemGroup } from './list-item-group';
import { ListItemHeader } from './list-item-header';

const isGroup = (child) => child.type === ListItemGroup || !!child.props['data-group'];
const isHeader = (child) => child.type === ListItemHeader || !!child.props['data-header'];

const getChildNodes = (element) => {
  if (isGroup(element)) {
    const { children } = element.props;
    if (typeof children !== 'string') {
      return childItems(children);
    }
  }
};

const getLabel = (element) => {
  if (typeof element.props.children === 'string') {
    return element.props.children;
  } else if (element.props.title) {
    return element.props.title;
  }
};

export const childItems = (children) =>
  React.Children.map(children, (child) => {
    const {
      'data-id': dataId,
      id = dataId,
      'data-expanded': dataExpanded,
      expanded = dataExpanded
    } = child.props;
    return {
      childNodes: getChildNodes(child),
      element: child,
      expanded,
      header: isHeader(child),
      id,
      label: getLabel(child)
    };
  });

export const sourceItems = (source) => {
  if (Array.isArray(source)) {
    return source.map((item) => (typeof item === 'string' ? { label: item } : item));
  } else if (source) {
    throw Error('list-child-items expects source to be an array');
  }
};
