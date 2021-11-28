import React from 'react';
import SvgIcon, { neverRerender } from './svg-icon';

const svgPath = `
<circle cx="9" cy="13.5" r="1.425" />
<circle cx="9" cy="9" r="1.425" />
<circle cx="9" cy="4.5" r="1.425" />
`;

export const MoreSmallListVertIcon = React.memo(
  (props) => <SvgIcon {...props} size={36} svgPath={svgPath} />,
  neverRerender
);
MoreSmallListVertIcon.displayName = 'MoreSmallListVertIcon';
