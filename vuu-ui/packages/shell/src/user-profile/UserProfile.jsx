import React, { useCallback, useRef, useState } from "react";
import { Button } from "@heswell/uitk-core";
import { DropdownBase } from "@heswell/uitk-lab";
import { UserSolidIcon } from "@heswell/uitk-icons";
import { UserPanel } from "./UserPanel";

import "./UserProfile.css";

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
      <DropdownBase placement="bottom-end" onCancel={toggle}>
        <Button ref={buttonRef} variant="secondary">
          <UserSolidIcon />
        </Button>
        <UserPanel
          layoutId={layoutId}
          onNavigate={handleNavigate}
          user={user}
        />
      </DropdownBase>
    </div>
  );
};
