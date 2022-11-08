import React, { HTMLAttributes } from 'react';

import './TabPanel.css';

export interface TabPanelProps extends HTMLAttributes<HTMLDivElement>{
  ariaLabelledBy: string;
}

const TabPanel = ({ ariaLabelledBy, children, id }: TabPanelProps) => {
  return (
    <div className="TabPanel" id={id} role="tabpanel" aria-labelledby={ariaLabelledBy}>
      {children}
    </div>
  );
};

export default TabPanel;
