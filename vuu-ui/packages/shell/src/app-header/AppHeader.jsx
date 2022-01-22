import React from 'react';
import { Button } from '@vuu-ui/ui-controls';
import { logout } from '../login-utils';
import './AppHeader.css';

export const AppHeader = () => {
  return (
    <header className="hwAppHeader">
      {/* <ToggleButton onChange={toggleColorScheme}>
              theme
            </ToggleButton> */}
      <Button aria-label="logout" data-icon="logout" onClick={logout} />
    </header>
  );
};
