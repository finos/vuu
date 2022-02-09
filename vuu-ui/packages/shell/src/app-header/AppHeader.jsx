import React from 'react';
import { UserProfile } from '../user-profile';
import './AppHeader.css';

export const AppHeader = ({ onNavigate, user, children, ...props }) => {
  return (
    <header className="hwAppHeader" {...props}>
      {/* <ToggleButton onChange={toggleColorScheme}>
              theme
            </ToggleButton> */}
      <UserProfile onNavigate={onNavigate} user={user} />
    </header>
  );
};
