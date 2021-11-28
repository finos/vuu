import { useState } from 'react';
import { Footer, Header, InlineHeader } from './grid-adornments';
const NO_ADORNMENTS = {
  header: { height: 0, component: null },
  inlineHeader: { height: 0, component: null },
  footer: { height: 0, component: null }
};

const useAdornments = ({ children }) => {
  const [adornments] = useState(children ? getAdornments(children) : NO_ADORNMENTS);
  return adornments;
};

export default useAdornments;

function getAdornments(children) {
  const adornments = {};

  if (Array.isArray(children)) {
    children.forEach((child) => {
      addAdornment(adornments, child);
    });
  } else {
    addAdornment(adornments, children);
  }

  return {
    ...NO_ADORNMENTS,
    ...adornments
  };
}

function addAdornment(adornments, child) {
  const [type, height, component] = getAdornment(child);
  if (type) {
    if (adornments[type]) {
      console.error(`Grid only supports one child of any type: multiple ${type}s`);
    } else {
      adornments[type] = { height, component };
    }
  } else {
    console.error(`unable to identify child element`);
  }
}

function getAdornment(child) {
  if (child.type === Header || child.type === Footer || child.type === InlineHeader) {
    const type =
      child.type === Header ? 'header' : child.type === Footer ? 'footer' : 'inlineHeader';
    const { height } = child.props;
    if (height === undefined) {
      console.error(`${type} must provide height`);
    }
    return [type, height, child];
  } else {
    return [null];
  }
}
