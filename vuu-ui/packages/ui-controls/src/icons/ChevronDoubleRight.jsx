import React from 'react';
import SvgIcon, { neverRerender } from './svg-icon';

const svgPath = `
<path d="M15,9a.994.994,0,0,1-.2925.7045l-3.9915,3.99a1,1,0,1,1-1.4355-1.386l.0245-.0245L12.5905,9,9.3045,5.715A1,1,0,0,1,10.691,4.28l.0245.0245,3.9915,3.99A.994.994,0,0,1,15,9Z" />
<path d="M9,9a.994.994,0,0,1-.2925.7045l-3.9915,3.99a1,1,0,1,1-1.436-1.385l.0245-.0245L6.5905,9,3.3045,5.715A1,1,0,0,1,4.6915,4.28l.0245.0245,3.9915,3.99A.994.994,0,0,1,9,9Z" />
`;

export const ChevronDoubleRightIcon = React.memo(
  (props) => <SvgIcon {...props} svgPath={svgPath} />,
  neverRerender
);
ChevronDoubleRightIcon.displayName = 'ChevronDoubleRightIcon';
