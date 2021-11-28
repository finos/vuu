import React from 'react';
import { useLayoutToolbarContext } from '../LayoutToolbarContext';

const ALIGNED_POSITIONS = {
  'flex-start': [0, 0, 0],
  baseline: [3, 1, 4],
  center: [8, 6, 7],
  'flex-end': [16, 12, 14],
  stretch: [0, 0, 0]
};

const JUSTIFIED_POSITIONS = {
  'flex-start': [0, 4, 8],
  'space-between': [0, 9, 18],
  'space-around': [2, 9, 16],
  center: [6, 10, 12],
  'flex-end': [10, 14, 18]
};

const iconContent = (name, alignItems, flexDirection, justifyContent) => {
  const [x1, x2, x3] = JUSTIFIED_POSITIONS[justifyContent];
  const [y1, y2, y3] = ALIGNED_POSITIONS[alignItems];
  const style =
    flexDirection === 'row'
      ? { transform: 'rotate(0deg)', transformOrigin: 'center center', transition: 'transform .3s' }
      : {
          transform: 'rotate(-90deg)',
          transformOrigin: 'center center',
          transition: 'transform .3s'
        };

  switch (name) {
    case 'terrace-align-flex-start':
      return (
        <g style={style}>
          <rect x={x1} y="0" width="4" height="8"></rect>
          <rect x={x2} y="0" width="4" height="12"></rect>
          <rect x={x3} y="0" width="6" height="10"></rect>
        </g>
      );
    case 'terrace-align-baseline':
      return (
        <g style={style}>
          <rect x={x1} y="3" width="4" height="8"></rect>
          <rect x={x2} y="1" width="4" height="12"></rect>
          <rect x={x3} y="4" width="6" height="10"></rect>
        </g>
      );

    case 'terrace-align-center':
      return (
        <g style={style}>
          <rect x={x1} y="8" width="4" height="8"></rect>
          <rect x={x2} y="6" width="4" height="12"></rect>
          <rect x={x3} y="7" width="6" height="10"></rect>
        </g>
      );
    case 'terrace-align-flex-end':
      return (
        <g style={style}>
          <rect x={x1} y="16" width="4" height="8"></rect>
          <rect x={x2} y="12" width="4" height="12"></rect>
          <rect x={x3} y="14" width="6" height="10"></rect>
        </g>
      );
    case 'terrace-align-stretch':
      return (
        <g style={style}>
          <rect x={x1} y="0" width="4" height="24"></rect>
          <rect x={x2} y="0" width="4" height="24"></rect>
          <rect x={x3} y="0" width="6" height="24"></rect>
        </g>
      );
    case 'terrace-justify-flex-start':
      return (
        <g style={style}>
          <rect x="0" y={y1} width="4" height="8"></rect>
          <rect x="4" y={y2} width="4" height="12"></rect>
          <rect x="8" y={y3} width="6" height="10"></rect>
        </g>
      );
    case 'terrace-justify-space-between':
      return (
        <g style={style}>
          <rect x="0" y={y1} width="4" height="8"></rect>
          <rect x="9" y={y2} width="4" height="12"></rect>
          <rect x="18" y={y3} width="6" height="10"></rect>
        </g>
      );
    case 'terrace-justify-space-around':
      return (
        <g style={style}>
          <rect x="2" y={y1} width="4" height="8"></rect>
          <rect x="9" y={y2} width="4" height="12"></rect>
          <rect x="16" y={y3} width="6" height="10"></rect>
        </g>
      );
    case 'terrace-justify-center':
      return (
        <g style={style}>
          <rect x="6" y={y1} width="4" height="8"></rect>
          <rect x="10" y={y2} width="4" height="12"></rect>
          <rect x="12" y={y3} width="6" height="10"></rect>
        </g>
      );
    case 'terrace-justify-flex-end':
      return (
        <g style={style}>
          <rect x="10" y={y1} width="4" height="8"></rect>
          <rect x="14" y={y2} width="4" height="12"></rect>
          <rect x="18" y={y3} width="6" height="10"></rect>
        </g>
      );
  }
};

const LayoutIcon = ({ name }) => {
  const { alignItems, flexDirection, justifyContent } = useLayoutToolbarContext();
  return (
    <svg
      aria-hidden="true"
      className="icon"
      focusable="false"
      height="24"
      shapeRendering="crispEdges"
      viewBox="0 0 24 24"
      width="24"
    >
      {iconContent(name, alignItems, flexDirection, justifyContent)}
    </svg>
  );
};

export default LayoutIcon;
