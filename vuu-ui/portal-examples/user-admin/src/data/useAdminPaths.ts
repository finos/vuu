import { createContext, useContext, useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";

/** The pathname the admin module's routes are mounted at, without a trailing slash. */
export const AdminBaseContext = createContext("");

/**
 * The pathname the module is mounted at: the current pathname without the
 * part matched by the mount route's `*`. Call it outside the module's own
 * `<Routes>`.
 */
export const useMountPath = () => {
  const { pathname } = useLocation();
  const splat = useParams()["*"] ?? "";
  return useMemo(() => {
    const depth = splat.split("/").filter(Boolean).length;
    const segments = pathname.split("/").filter(Boolean);
    const mount = segments.slice(0, segments.length - depth).join("/");
    return mount ? `/${mount}` : "";
  }, [pathname, splat]);
};

export type ApplicationTab = "groups" | "users";

/** Absolute paths to the module's pages, so links work from any nested route. */
export const useAdminPaths = () => {
  const base = useContext(AdminBaseContext);
  return useMemo(
    () => ({
      application: (name: string, tab?: ApplicationTab) =>
        `${base}/applications/${encodeURIComponent(name)}${tab && tab !== "users" ? `?tab=${tab}` : ""}`,
      newUser: `${base}/users/new`,
      overview: `${base}/overview`,
      user: (userId: string) => `${base}/users/${encodeURIComponent(userId)}`,
    }),
    [base],
  );
};
