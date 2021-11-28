import React from 'react';
import SvgIcon, { neverRerender } from './svg-icon';

const svgPath = `
<path d="M3,9a.994.994,0,0,0,.2925.7045l3.9915,3.99a1,1,0,1,0,1.4355-1.386L8.695,12.284,5.4095,9l3.286-3.285A1,1,0,0,0,7.309,4.28l-.0245.0245L3.293,8.2945A.994.994,0,0,0,3,9Z" />
<path d="M9,9a.994.994,0,0,0,.2925.7045l3.9915,3.99a1,1,0,1,0,1.4355-1.386l-.0245-.0245L11.4095,9l3.286-3.285A1,1,0,0,0,13.309,4.28l-.0245.0245L9.293,8.2945A.994.994,0,0,0,9,9Z" />
`;

export const ChevronDoubleLeftIcon = React.memo(
  (props) => <SvgIcon {...props} svgPath={svgPath} />,
  neverRerender
);
ChevronDoubleLeftIcon.displayName = 'ChevronDoubleLeftIcon';
