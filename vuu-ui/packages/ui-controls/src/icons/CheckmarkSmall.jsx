import React from 'react';
import SvgIcon, { neverRerender } from './svg-icon';

const svgPathCheckmarkSmall = `
<path d="M3.78809,9A.999.999,0,0,1,3,8.61523L.71191,5.61508A.9998.9998,0,1,1,2.28808,4.38461l1.5,1.99137L7.71192,1.385A.9998.9998,0,1,1,9.28809,2.61549L4.57617,8.61523A.999.999,0,0,1,3.78809,9Z" />
`;
export const CheckmarkSmallIcon = React.memo(
  (props) => <SvgIcon {...props} size={10} svgPath={svgPathCheckmarkSmall} />,
  neverRerender
);
CheckmarkSmallIcon.displayName = 'CheckmarkSmallIcon';
