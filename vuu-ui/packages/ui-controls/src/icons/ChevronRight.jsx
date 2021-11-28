import React from 'react';
import SvgIcon, { neverRerender } from './svg-icon';

const svgPath = `
<path d="M12,9a.994.994,0,0,1-.2925.7045l-3.9915,3.99a1,1,0,1,1-1.4355-1.386l.0245-.0245L9.5905,9,6.3045,5.715A1,1,0,0,1,7.691,4.28l.0245.0245,3.9915,3.99A.994.994,0,0,1,12,9Z" />
`;
export const ChevronRightIcon = React.memo(
  (props) => <SvgIcon {...props} svgPath={svgPath} />,
  neverRerender
);
ChevronRightIcon.displayName = 'ChevronRight';
