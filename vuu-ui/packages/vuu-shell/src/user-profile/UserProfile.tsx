import { Button } from "@salt-ds/core";
import { DropdownBase } from "@heswell/salt-lab";
import { UserSolidIcon } from "@salt-ds/icons";
import { UserPanel } from "./UserPanel";

import "./UserProfile.css";
import { VuuUser } from "../shell";

export interface UserProfileProps {
  layoutId: string;
  loginUrl?: string;
  onNavigate: (id: string) => void;
  user: VuuUser;
}

export const UserProfile = ({
  layoutId,
  loginUrl,
  onNavigate,
  user,
}: UserProfileProps) => {
  const handleNavigate = (id: string) => {
    onNavigate(id);
  };

  return (
    <DropdownBase className="vuuUserProfile" placement="bottom-end">
      <Button variant="secondary">
        <UserSolidIcon />
      </Button>
      <UserPanel
        layoutId={layoutId}
        loginUrl={loginUrl}
        onNavigate={handleNavigate}
        user={user}
      />
    </DropdownBase>
  );
};
