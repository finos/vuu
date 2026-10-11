import { type MouseEvent, type ReactNode, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export interface RouteLinkProps {
  "aria-label"?: string;
  children: ReactNode;
  className?: string;
  path: string;
  title?: string;
}

/**
 * An anchor for an in-app route, so links can be opened in a new tab, while
 * a plain click navigates client side.
 */
export const RouteLink = ({ children, path, ...props }: RouteLinkProps) => {
  const navigate = useNavigate();
  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
        e.preventDefault();
        navigate(path);
      }
    },
    [navigate, path],
  );
  return (
    <a {...props} href={path} onClick={handleClick}>
      {children}
    </a>
  );
};
