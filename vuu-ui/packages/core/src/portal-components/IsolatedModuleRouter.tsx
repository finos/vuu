import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createMemoryRouter,
  createPath,
  RouterProvider,
  UNSAFE_DataRouterContext,
  UNSAFE_DataRouterStateContext,
  UNSAFE_LocationContext,
  UNSAFE_NavigationContext,
  UNSAFE_RouteContext,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import { PortalLinkProvider } from "../portal-link/PortalLink";

/** The module's base path, without a trailing slash or splat. */
export const normalizeModulePath = (path: string) => {
  const trimmed = path.replace(/\/\*$/, "").replace(/\/+$/, "");
  if (trimmed === "") {
    return "/";
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
};

/** True if this location is at or beneath the module path. */
export const isModuleLocation = (location: string, modulePath: string) => {
  const base = normalizeModulePath(modulePath);
  if (base === "/") {
    return location.startsWith("/");
  }
  return (
    location === base ||
    location.startsWith(`${base}/`) ||
    location.startsWith(`${base}?`) ||
    location.startsWith(`${base}#`)
  );
};

const ROOT_ROUTE_CONTEXT = { isDataRoute: false, matches: [], outlet: null };

/**
 * Hides the host router from its children, so they can render their own
 * `<Router>`. React Router does not allow one router inside another, and its
 * route matching would otherwise be relative to the host's matched routes.
 */
const DetachFromHostRouter = ({ children }: { children: ReactNode }) => (
  <UNSAFE_DataRouterContext.Provider value={null}>
    <UNSAFE_DataRouterStateContext.Provider value={null}>
      <UNSAFE_NavigationContext.Provider value={null as never}>
        <UNSAFE_LocationContext.Provider value={null as never}>
          <UNSAFE_RouteContext.Provider value={ROOT_ROUTE_CONTEXT}>
            {children}
          </UNSAFE_RouteContext.Provider>
        </UNSAFE_LocationContext.Provider>
      </UNSAFE_NavigationContext.Provider>
    </UNSAFE_DataRouterStateContext.Provider>
  </UNSAFE_DataRouterContext.Provider>
);

interface ModuleRouteState {
  children: ReactNode;
  onLocationChange?: (location: string) => void;
}

// The module router is created once, so its route element reads the
// latest children and callback from context rather than from the route.
const ModuleRouteContext = createContext<ModuleRouteState>({
  children: null,
});

const LocationTracker = ({
  onLocationChange,
}: {
  onLocationChange?: (location: string) => void;
}) => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const path = createPath(location);
  const lastPath = useRef(path);
  const hasNavigated = useRef(false);
  useEffect(() => {
    if (path !== lastPath.current) {
      lastPath.current = path;
      if (navigationType !== "REPLACE") {
        hasNavigated.current = true;
      }
      // A redirect as the module mounts, e.g. to its default page, is not a
      // change worth saving.
      if (hasNavigated.current) {
        onLocationChange?.(path);
      }
    }
  }, [navigationType, onLocationChange, path]);
  return null;
};

const ModuleRoute = () => {
  const { children, onLocationChange } = useContext(ModuleRouteContext);
  return (
    <>
      <LocationTracker onLocationChange={onLocationChange} />
      {children}
    </>
  );
};

export interface IsolatedModuleRouterProps {
  children: ReactNode;
  /** The module location to start at, e.g. one saved with the item. */
  initialLocation?: string;
  /** The module's route path, e.g. `/admin/users`. */
  modulePath: string;
  /** Called when the module navigates within its own routes. */
  onLocationChange?: (location: string) => void;
}

/**
 * Renders a module with its own in-memory data router, so the module's
 * routing (`useNavigate`, relative links, `<Navigate>`) never changes the
 * host URL. It is a data router, like the host's, so modules can use data
 * router APIs such as `useBlocker`.
 * The module is routed at `${modulePath}/*`, exactly as on its full page
 * route. `PortalLink`s with `routeScope="portal"` still navigate the host.
 */
export const IsolatedModuleRouter = ({
  children,
  initialLocation,
  modulePath,
  onLocationChange,
}: IsolatedModuleRouterProps) => {
  const hostNavigation = useContext(UNSAFE_NavigationContext);
  const hostNavigator = hostNavigation?.navigator;
  const basePath = normalizeModulePath(modulePath);

  // The router is created once, from the location the item started at.
  const [router] = useState(() =>
    createMemoryRouter(
      [
        {
          path: basePath === "/" ? "/*" : `${basePath}/*`,
          element: <ModuleRoute />,
        },
      ],
      {
        initialEntries: [
          initialLocation && isModuleLocation(initialLocation, basePath)
            ? initialLocation
            : basePath,
        ],
      },
    ),
  );

  useEffect(() => () => router.dispose(), [router]);

  const routeState = useMemo<ModuleRouteState>(
    () => ({ children, onLocationChange }),
    [children, onLocationChange],
  );

  const hostNavigate = useMemo(
    () =>
      hostNavigator
        ? (to: string) => {
            hostNavigator.push(to);
          }
        : undefined,
    [hostNavigator],
  );

  return (
    <DetachFromHostRouter>
      <PortalLinkProvider hostNavigate={hostNavigate} modulePath={basePath}>
        <ModuleRouteContext.Provider value={routeState}>
          <RouterProvider router={router} />
        </ModuleRouteContext.Provider>
      </PortalLinkProvider>
    </DetachFromHostRouter>
  );
};
