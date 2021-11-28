import React from 'react';
import SvgIcon, { neverRerender } from './svg-icon';

const svgPath = `
<path d="M15.473,1H1.527a.5.5,0,0,0-.3935.8085L7,9.2945V16.95a.496.496,0,0,0,.84.412l1.9905-2.0765A.60949.60949,0,0,0,10,14.864V9.2945l5.8665-7.486A.5.5,0,0,0,15.473,1Z" />
`;
export const FilterIcon = React.memo(
  (props) => <SvgIcon {...props} size={36} svgPath={svgPath} />,
  neverRerender
);
FilterIcon.displayName = 'FilterIcon';
