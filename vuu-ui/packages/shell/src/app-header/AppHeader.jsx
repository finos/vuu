import React from 'react';
import { UserProfile } from '../user-profile';
import './AppHeader.css';

export const AppHeader = ({ layoutId, onNavigate, user, ...props }) => {
  return (
    <header className="hwAppHeader" {...props}>
      {/* <ToggleButton onChange={toggleColorScheme}>
              theme
            </ToggleButton> */}
      <UserProfile layoutId={layoutId} onNavigate={onNavigate} user={user} />
    </header>
  );
};
