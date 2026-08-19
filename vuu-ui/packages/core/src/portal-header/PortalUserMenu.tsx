import {
  Avatar,
  Button,
  Divider,
  Menu,
  MenuItem,
  MenuPanel,
  MenuTrigger,
} from "@salt-ds/core";
import { ChevronDownIcon, HistoryIcon } from "@salt-ds/icons";
import { useOptionalAuthenticatedUser } from "@vuu-ui/core";
import type { ReactNode } from "react";
import { useOptionalSavedState } from "../saved-state/SavedStateContext";
import { usePortalLogout } from "./usePortalLogout";

const classBase = "vuuPortalUserMenu";

export interface PortalUserMenuProps {
  /** Items shown above **Saved state…**, e.g. a future **Settings…** item. */
  children?: ReactNode;
}

/** The header user menu (§9.2): Saved state… and Log out. */
export const PortalUserMenu = ({ children }: PortalUserMenuProps) => {
  const userName = useOptionalAuthenticatedUser()?.userName;
  const savedState = useOptionalSavedState();
  const logout = usePortalLogout();

  return (
    <Menu>
      <MenuTrigger>
        <Button
          appearance="transparent"
          aria-label={userName ? undefined : "User menu"}
          className={classBase}
          sentiment="neutral"
        >
          <Avatar name={userName} size={0.75} />
          {userName ? (
            <span className={`${classBase}-userName`}>{userName}</span>
          ) : null}
          <ChevronDownIcon aria-hidden />
        </Button>
      </MenuTrigger>
      <MenuPanel className={`${classBase}-panel`}>
        {children}
        {savedState ? (
          <MenuItem onClick={() => savedState.open()}>
            <HistoryIcon aria-hidden />
            Saved state…
          </MenuItem>
        ) : null}
        {children || savedState ? <Divider aria-hidden /> : null}
        <MenuItem onClick={() => void logout()}>Log out</MenuItem>
      </MenuPanel>
    </Menu>
  );
};
