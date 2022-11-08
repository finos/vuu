import { HTMLAttributes } from "react";
import { VuuUser } from "../shell";
import { UserProfile } from "../user-profile";
import "./AppHeader.css";

export interface AppHeaderProps extends HTMLAttributes<HTMLDivElement> {
  layoutId: string;
  loginUrl?: string;
  onNavigate: (id: string) => void;
  user: VuuUser;
}

export const AppHeader = ({
  layoutId,
  loginUrl,
  onNavigate,
  user,
  ...htmlAttributes
}: AppHeaderProps) => {
  return (
    <header className="hwAppHeader" {...htmlAttributes}>
      {/* <ToggleButton onChange={toggleColorScheme}>
              theme
            </ToggleButton> */}
      <UserProfile
        layoutId={layoutId}
        loginUrl={loginUrl}
        onNavigate={onNavigate}
        user={user}
      />
    </header>
  );
};
