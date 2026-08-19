import {
  createPath,
  NavLink,
  parsePath,
  type NavLinkProps,
  type To,
} from "react-router-dom";
import { createContext, useContext, type ReactNode } from "react";

interface PortalLinkContextValue {
  modulePath: string;
  windowPath?: string;
}

const PortalLinkContext = createContext<PortalLinkContextValue | undefined>(
  undefined,
);

interface PortalLinkProviderProps extends PortalLinkContextValue {
  children: ReactNode;
}

export const PortalLinkProvider = ({
  children,
  modulePath,
  windowPath,
}: PortalLinkProviderProps) => (
  <PortalLinkContext.Provider value={{ modulePath, windowPath }}>
    {children}
  </PortalLinkContext.Provider>
);

export interface PortalLinkProps extends NavLinkProps {
  /** Use for intentional navigation outside the current remote module. */
  routeScope?: "module" | "portal";
}

const normalizeBasePath = (path: string) =>
  path.replace(/\/\*$/, "").replace(/\/+$/, "") || "/";

const toWindowPath = (
  pathname: string,
  modulePath: string,
  windowPath: string,
) => {
  const normalizedModulePath = normalizeBasePath(modulePath);
  const normalizedWindowPath = normalizeBasePath(windowPath);

  if (
    pathname === normalizedWindowPath ||
    pathname.startsWith(`${normalizedWindowPath}/`)
  ) {
    return pathname;
  }

  const moduleSuffix =
    pathname === normalizedModulePath
      ? ""
      : pathname.startsWith(`${normalizedModulePath}/`)
        ? pathname.slice(normalizedModulePath.length)
        : pathname;

  return `${normalizedWindowPath}${moduleSuffix.startsWith("/") ? "" : "/"}${moduleSuffix}`;
};

const toWindowDestination = (
  to: To,
  modulePath: string,
  windowPath: string,
): To => {
  if (typeof to === "string") {
    const path = parsePath(to);
    if (!path.pathname?.startsWith("/") || path.pathname.startsWith("//")) {
      return to;
    }
    return createPath({
      ...path,
      pathname: toWindowPath(path.pathname, modulePath, windowPath),
    });
  }

  if (!to.pathname?.startsWith("/") || to.pathname.startsWith("//")) {
    return to;
  }
  return {
    ...to,
    pathname: toWindowPath(to.pathname, modulePath, windowPath),
  };
};

/** A NavLink that keeps module navigation inside its standalone window route. */
export const PortalLink = ({
  routeScope = "module",
  to,
  ...props
}: PortalLinkProps) => {
  const context = useContext(PortalLinkContext);
  const destination =
    context?.windowPath && routeScope === "module"
      ? toWindowDestination(to, context.modulePath, context.windowPath)
      : to;

  return <NavLink {...props} to={destination} />;
};
