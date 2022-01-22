import React from 'react';
import { Button } from '@vuu-ui/ui-controls';
import { logout } from '../login';
import './AppHeader.css';

export const AppHeader = ({ user, children, ...props }) => {
  return (
    <header className="hwAppHeader" {...props}>
      {/* <ToggleButton onChange={toggleColorScheme}>
              theme
            </ToggleButton> */}
      <Button aria-label="logout" data-icon="logout" onClick={logout} />
    </header>
  );
};
