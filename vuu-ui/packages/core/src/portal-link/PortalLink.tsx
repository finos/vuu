import {
  createPath,
  NavLink,
  parsePath,
  useHref,
  type NavLinkProps,
  type To,
} from "react-router-dom";
import {
  createContext,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useContext,
} from "react";

interface PortalLinkContextValue {
  /**
   * Navigates the portal host, when the module has its own isolated router,
   * e.g. a module rendered in a workspace item. `PortalLink`s with
   * `routeScope="portal"` use it to leave the module.
   */
  hostNavigate?: (to: string) => void;
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
  hostNavigate,
  modulePath,
  windowPath,
}: PortalLinkProviderProps) => (
  <PortalLinkContext.Provider value={{ hostNavigate, modulePath, windowPath }}>
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

const isPlainLeftClick = (event: MouseEvent<HTMLAnchorElement>) =>
  event.button === 0 &&
  !event.metaKey &&
  !event.altKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  (!event.currentTarget.target || event.currentTarget.target === "_self");

/**
 * A NavLink that keeps module navigation inside its standalone window route.
 * With `routeScope="portal"`, in a module with an isolated router, it
 * navigates the portal host instead of the module's router.
 */
export const PortalLink = ({
  onClick,
  routeScope = "module",
  to,
  ...props
}: PortalLinkProps) => {
  const context = useContext(PortalLinkContext);
  const destination =
    context?.windowPath && routeScope === "module"
      ? toWindowDestination(to, context.modulePath, context.windowPath)
      : to;
  const href = useHref(destination);
  const hostNavigate =
    routeScope === "portal" ? context?.hostNavigate : undefined;

  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (hostNavigate && !event.defaultPrevented && isPlainLeftClick(event)) {
        event.preventDefault();
        hostNavigate(href);
      }
    },
    [hostNavigate, href, onClick],
  );

  return <NavLink {...props} onClick={handleClick} to={destination} />;
};
