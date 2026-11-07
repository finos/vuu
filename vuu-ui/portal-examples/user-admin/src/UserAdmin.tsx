import { Avatar, StatusIndicator, Text } from "@salt-ds/core";
import { UserAdminIcon } from "@salt-ds/icons";
import { NotificationsProvider } from "@vuu-ui/vuu-notifications";
import { useModal } from "@vuu-ui/core";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useBlocker,
  useBeforeUnload,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { AdminSearch } from "./components/AdminSearch";
import { EditingContext } from "./components/EditingContext";
import { AdminDataContext } from "./data/AdminDataContext";
import { EMPTY_CONFIG, type AdminConfig } from "./data/admin-contract";
import { ApplicationModelProvider } from "./data/ApplicationModelProvider";
import {
  AdminBaseContext,
  useAdminPaths,
  useMountPath,
} from "./data/useAdminPaths";
import { APPLICATION_PARAM } from "./data/useApplicationScope";
import { ApplicationPage } from "./pages/application/ApplicationPage";
import { OverviewPage } from "./pages/overview/OverviewPage";
import { CreateUserPage } from "./pages/user/CreateUserPage";
import { UserPage } from "./pages/user/UserPage";
import "./themeFallbacks.css";
import "./UserAdmin.css";

export const SEARCH_PARAM = "search";

const HeaderSearch = () => {
  const navigate = useNavigate();
  const paths = useAdminPaths();
  const [params] = useSearchParams();
  const search = params.get(SEARCH_PARAM) ?? "";
  return (
    <AdminSearch
      className="vuuIdentityAdmin-headerSearch"
      defaultValue={search}
      key={search}
      label="Search applications and users"
      onSearch={(value) =>
        navigate(
          value
            ? `${paths.overview}?${new URLSearchParams({ [SEARCH_PARAM]: value })}`
            : paths.overview,
        )
      }
      placeholder="Search applications and users"
    />
  );
};

/**
 * Overview is the only list page, so the old `applications`, `users`,
 * `groups` and `roles` pages open the application they were scoped to, or
 * Overview.
 */
const LegacyPageRedirect = () => {
  const paths = useAdminPaths();
  const [params] = useSearchParams();
  const application = params.get(APPLICATION_PARAM);
  return (
    <Navigate
      replace
      to={application ? paths.application(application) : paths.overview}
    />
  );
};

const ApplicationRoute = () => {
  const { applicationName = "" } = useParams();
  return <ApplicationPage key={applicationName} name={applicationName} />;
};

const UserRoute = () => {
  const { userId = "" } = useParams();
  return <UserPage key={userId} userId={userId} />;
};

const AdminLayout = () => {
  const [editing, setEditingState] = useState(false);
  // Read by the blocker, so a page can clear its edits and navigate at once.
  const editingRef = useRef(false);
  const setEditing = useCallback((value: boolean) => {
    editingRef.current = value;
    setEditingState(value);
  }, []);
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        editingRef.current &&
        currentLocation.pathname !== nextLocation.pathname,
      [],
    ),
  );
  const { closePrompt, showPrompt } = useModal();
  const { proceed, reset, state } = blocker;

  useEffect(() => {
    if (state !== "blocked") return;

    showPrompt(
      <p>
        Save or discard your edits before leaving this page. Choose Cancel to
        keep editing.
      </p>,
      {
        cancelButtonLabel: "Cancel",
        confirmButtonLabel: "Discard changes",
        onCancel: reset,
        onClose: reset,
        onConfirm: () => {
          setEditing(false);
          proceed();
        },
        title: "Unsaved changes",
      },
    );

    return closePrompt;
  }, [closePrompt, proceed, reset, setEditing, showPrompt, state]);

  useBeforeUnload((event) => {
    if (editing) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  return (
    <EditingContext.Provider value={setEditing}>
      <div className="vuuIdentityAdmin">
        <header className="vuuIdentityAdmin-header">
          <div className="vuuIdentityAdmin-brand">
            <Avatar
              aria-hidden
              color="accent"
              fallbackIcon={<UserAdminIcon />}
              size={1.5}
            />
            <div>
              <h1>Identity Admin</h1>
              <Text color="secondary" styleAs="label">
                Applications and the users who can open them
              </Text>
            </div>
          </div>
          <HeaderSearch />
        </header>
        <div className="vuuIdentityAdmin-content">
          {editing ? (
            <p role="status" className="vuuIdentityAdmin-editNotice">
              <StatusIndicator status="warning" />
              Save or discard your edits before switching pages or identities.
            </p>
          ) : null}
          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </EditingContext.Provider>
  );
};

export interface UserAdminProps {
  config?: AdminConfig;
}

const UserAdmin = ({ config = EMPTY_CONFIG }: UserAdminProps) => (
  <AdminBaseContext.Provider value={useMountPath()}>
    <NotificationsProvider>
      <AdminDataContext.Provider value={config}>
        <ApplicationModelProvider>
          <Routes>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<OverviewPage />} />
              <Route path="applications" element={<LegacyPageRedirect />} />
              <Route
                path="applications/:applicationName"
                element={<ApplicationRoute />}
              />
              <Route path="users" element={<LegacyPageRedirect />} />
              <Route path="users/new" element={<CreateUserPage />} />
              <Route path="users/:userId" element={<UserRoute />} />
              <Route path="groups" element={<LegacyPageRedirect />} />
              <Route path="roles" element={<LegacyPageRedirect />} />
              <Route
                path="*"
                element={
                  <p>
                    Page not found.{" "}
                    <Link relative="path" to="../overview">
                      Return to Overview
                    </Link>
                  </p>
                }
              />
            </Route>
          </Routes>
        </ApplicationModelProvider>
      </AdminDataContext.Provider>
    </NotificationsProvider>
  </AdminBaseContext.Provider>
);

export default UserAdmin;
