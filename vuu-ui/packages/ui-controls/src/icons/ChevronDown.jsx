import React from 'react';
import SvgIcon, { neverRerender } from './svg-icon';

const svgPath = `<path d="M4,7.01a1,1,0,0,1,1.7055-.7055l3.289,3.286,3.289-3.286a1,1,0,0,1,1.437,1.3865l-.0245.0245L9.7,11.7075a1,1,0,0,1-1.4125,0L4.293,7.716A.9945.9945,0,0,1,4,7.01Z" />`;
export const ChevronDownIcon = React.memo(
  (props) => <SvgIcon {...props} svgPath={svgPath} />,
  neverRerender
);
ChevronDownIcon.displayName = 'ChevronDownIcon';
