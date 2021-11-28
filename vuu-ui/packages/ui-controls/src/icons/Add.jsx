import React from 'react';
import SvgIcon, { neverRerender } from './svg-icon';

const svgPath = `
<path d="M29 16h-9V7a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v9H7a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h9v9a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-9h9a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1z"/>
`;
export const AddIcon = React.memo(
  (props) => <SvgIcon {...props} size={36} svgPath={svgPath} />,
  neverRerender
);

AddIcon.displayName = 'AddIcon';
