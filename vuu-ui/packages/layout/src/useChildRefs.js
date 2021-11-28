import React, { createRef, useRef } from 'react';

export const useChildRefs = (children) => {
  const childRefs = useRef([]);

  const childCount = React.Children.count(children);
  if (childRefs.current.length !== childCount) {
    // add or remove refs
    childRefs.current = Array(childCount)
      .fill(null)
      .map((_, i) => childRefs.current[i] || createRef());
  }

  return childRefs.current;
};
