import React from 'react';

import './TabPanel.css';

const TabPanel = ({ ariaLabelledBy, children, id }) => {
  return (
    <div className="TabPanel" id={id} role="tabpanel" aria-labelledby={ariaLabelledBy}>
      {children}
    </div>
  );
};

export default TabPanel;
