import React from 'react';
import SvgIcon, { neverRerender } from './svg-icon';

const svgPath = `
<path d="M26.485 6.686L18 15.172 9.515 6.686a1 1 0 0 0-1.414 0L6.686 8.1a1 1 0 0 0 0 1.414L15.172 18l-8.486 8.485a1 1 0 0 0 0 1.414L8.1 29.314a1 1 0 0 0 1.414 0L18 20.828l8.485 8.486a1 1 0 0 0 1.414 0l1.415-1.414a1 1 0 0 0 0-1.414L20.828 18l8.486-8.485a1 1 0 0 0 0-1.414L27.9 6.686a1 1 0 0 0-1.415 0z"></path>
`;

export const CloseIcon = React.memo(
  (props) => <SvgIcon {...props} size={36} svgPath={svgPath} />,
  neverRerender
);
CloseIcon.displayName = 'CloseIcon';
