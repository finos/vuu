import React from 'react';
import { ListItemGroup } from './list-item-group';
import { ListItemHeader } from './list-item-header';

export const isGroup = (child) => child.type === ListItemGroup || !!child.props['data-group'];
export const isHeader = (child) => child.type === ListItemHeader || !!child.props['data-header'];

// question how well will this scale ?
const proxyChildNodes = new WeakMap();

const listProxyHandlers = {
  get(target, prop, receiver) {
    if (prop === 'set') {
      return function (props) {
        const newProxy = createListProxy(React.cloneElement(target, props));
        if (proxyChildNodes.has(receiver)) {
          const childNodes = proxyChildNodes.get(receiver);
          proxyChildNodes.delete(receiver);
          proxyChildNodes.set(newProxy, props.childNodes ?? childNodes);
        }
        return newProxy;
      };
    }
    if (prop === 'header') {
      return isHeader(target);
    }
    if (/(expanded|label|id)/.test(prop)) {
      if (target.props[`data-${prop}`] !== undefined) {
        return target.props[`data-${prop}`];
      }
    } else if (prop === 'childNodes') {
      if (proxyChildNodes.has(receiver)) {
        return proxyChildNodes.get(receiver);
      } else {
        // we don't assume the presence of children indicates a group
        // A leaf item may have an internal structure
        if (isGroup(target)) {
          const { children } = target.props;
          if (typeof children !== 'string') {
            return children;
          }
        }
      }
    }
    if (prop === 'label') {
      if (typeof target.props.children === 'string') {
        return target.props.children;
      } else if (target.props.title) {
        return target.props.title;
      }
    } else if (prop === 'wrappedSource') {
      return target;
    } else if (prop === '$$typeof' || prop === 'type') {
      // for devtools
      return target[prop];
    }
    return target.props[prop];
  },
  set(target, property, value, receiver) {
    if (property === 'childNodes') {
      proxyChildNodes.set(receiver, value);
      return true;
    } else {
      return false;
    }
  }
};

export const createListProxy = (element) => new Proxy(element, listProxyHandlers);
