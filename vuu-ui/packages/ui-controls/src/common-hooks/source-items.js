import React from 'react';
// import { ListItemGroup } from './list-item-group';
// import { ListItemHeader } from './list-item-header';

const isGroup = (child) => !!child.props['data-group'];
const isHeader = (child) => !!child.props['data-header'];
// const isGroup = (child) => child.type === ListItemGroup || !!child.props['data-group'];
// const isHeader = (child) => child.type === ListItemHeader || !!child.props['data-header'];

const getChildNodes = (element) => {
  if (isGroup(element)) {
    const { children } = element.props;
    if (typeof children !== 'string') {
      return childItems(children);
    }
  }
};

const getLabel = (element) => {
  const { children, title, label = title } = element.props;
  if (typeof children === 'string') {
    return children;
  } else if (label) {
    return label;
  }
};

export const childItems = (children) =>
  React.Children.map(children, (child) => {
    const {
      'data-id': dataId,
      id = dataId,
      'data-expanded': dataExpanded,
      expanded = dataExpanded,
      'data-closeable': dataCloseable,
      closeable = dataCloseable
    } = child.props;
    return {
      childNodes: getChildNodes(child),
      closeable,
      element: child,
      expanded,
      header: isHeader(child),
      id,
      label: getLabel(child)
    };
  });

const NO_OPTIONS = {};

export const sourceItems = (source, options = NO_OPTIONS) => {
  if (Array.isArray(source)) {
    if (options !== NO_OPTIONS) {
      return source.map((item) =>
        typeof item === 'string' ? { ...options, label: item } : { ...options, ...item }
      );
    } else {
      return source.map((item) => (typeof item === 'string' ? { label: item } : item));
    }
  } else if (source) {
    throw Error('list-child-items expects source to be an array');
  }
};
