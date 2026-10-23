import { createContext, useContext } from "react";

export interface PortalShellNavContextValue {
  /**
   * Sets the width of the shell's navigation column (a CSS length), or
   * releases it with `undefined`. Used by `PortalNav` to size the column to
   * its display mode; the change animates.
   */
  setNavWidth: (width: string | undefined) => void;
}

export const PortalShellNavContext = createContext<
  PortalShellNavContextValue | undefined
>(undefined);

/** The shell's navigation column, or undefined outside a `PortalShell`. */
export const usePortalShellNav = () => useContext(PortalShellNavContext);
