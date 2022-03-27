import React, { forwardRef, useLayoutEffect, useRef } from 'react';
import { Portal } from '@vuu-ui/theme';
import { useForkRef } from '../utils';

import './Draggable.css';

const Draggable = forwardRef(function Draggable({ className, element, rect }, forwardedRef) {
  const ref = useRef(null);
  const forkedRef = useForkRef(forwardedRef, ref);
  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = '';
      ref.current.appendChild(element);
    }
  }, [element]);
  const { left, top, width, height } = rect;
  return (
    <div
      className={`hwDraggable hwDraggable-${className}`}
      ref={forkedRef}
      style={{ left, top, width, height }}
    />
  );
});

export const renderDraggable = (ref, element, className, rect) => {
  return (
    <Portal>
      <Draggable ref={ref} element={element} className={className} rect={rect} />
    </Portal>
  );
};
