import React, { useCallback, useRef, useState } from 'react';
import { Button, Dropdown } from '@vuu-ui/ui-controls';
import { UserPanel } from './UserPanel';

import './UserProfile.css';

export const UserProfile = ({ layoutId, onNavigate, user }) => {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const buttonRef = useRef(null);

  const toggle = useCallback(() => {
    setOpen((isOpen) => {
      return (openRef.current = !isOpen);
    });
    requestAnimationFrame(() => {
      if (!openRef.current) {
        requestAnimationFrame(() => {
          buttonRef.current.focus();
        });
      }
    });
  }, []);

  const handleNavigate = (id) => {
    setOpen(false);
    onNavigate(id);
  };

  return (
    <div className="vuuUserProfile">
      <Button active={open} ref={buttonRef} onClick={toggle} data-icon />
      <Dropdown
        autofocus
        align="bottom-right"
        anchorEl={buttonRef.current}
        onCancel={toggle}
        open={open}
        width={300}>
        {open && <UserPanel layoutId={layoutId} onNavigate={handleNavigate} user={user} />}
      </Dropdown>
    </div>
  );
};
