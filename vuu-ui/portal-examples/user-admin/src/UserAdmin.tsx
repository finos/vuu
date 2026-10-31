import {
  Avatar,
  StatusIndicator,
  Text,
  VerticalNavigation,
  VerticalNavigationItem,
  VerticalNavigationItemContent,
  VerticalNavigationItemLabel,
  VerticalNavigationItemTrigger,
} from "@salt-ds/core";
import {
  AppSwitcherIcon,
  DashboardIcon,
  KeyIcon,
  UserAdminIcon,
  UserGroupIcon,
  UserIcon,
} from "@salt-ds/icons";
import { NotificationsProvider } from "@vuu-ui/vuu-notifications";
import { useModal } from "@vuu-ui/core";
import { PortalLink } from "@vuu-ui/core/portal";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useBlocker,
  useBeforeUnload,
  useMatch,
  useNavigate,
  useResolvedPath,
  useSearchParams,
} from "react-router-dom";
import { AdminSearch } from "./components/AdminSearch";
import { EditingContext } from "./components/EditingContext";
import { AdminDataContext } from "./data/AdminDataContext";
import { EMPTY_CONFIG, type AdminConfig } from "./data/admin-contract";
import { ApplicationModelProvider } from "./data/ApplicationModelProvider";
import { ApplicationsPage } from "./pages/applications/ApplicationsPage";
import { GroupsPage } from "./pages/groups/GroupsPage";
import { OverviewPage } from "./pages/overview/OverviewPage";
import { RolesPage } from "./pages/roles/RolesPage";
import { UsersPage } from "./pages/users/UsersPage";
import "./themeFallbacks.css";
import "./UserAdmin.css";

export const SEARCH_PARAM = "search";

const PAGES: { icon: ReactNode; label: string; page: string }[] = [
  { icon: <DashboardIcon aria-hidden />, label: "Overview", page: "overview" },
  {
    icon: <AppSwitcherIcon aria-hidden />,
    label: "Applications",
    page: "applications",
  },
  { icon: <UserIcon aria-hidden />, label: "Users", page: "users" },
  { icon: <UserGroupIcon aria-hidden />, label: "Groups", page: "groups" },
  { icon: <KeyIcon aria-hidden />, label: "Roles", page: "roles" },
];

const NavItem = ({
  icon,
  label,
  page,
}: {
  icon: ReactNode;
  label: string;
  page: string;
}) => {
  const to = `../${page}`;
  const { pathname } = useResolvedPath(to, { relative: "path" });
  const active = useMatch({ end: false, path: pathname }) !== null;
  return (
    <VerticalNavigationItem active={active}>
      <VerticalNavigationItemContent>
        <VerticalNavigationItemTrigger
          render={<PortalLink relative="path" to={to} />}
        >
          {icon}
          <VerticalNavigationItemLabel>{label}</VerticalNavigationItemLabel>
        </VerticalNavigationItemTrigger>
      </VerticalNavigationItemContent>
    </VerticalNavigationItem>
  );
};

const HeaderSearch = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const search = params.get(SEARCH_PARAM) ?? "";
  return (
    <AdminSearch
      className="vuuIdentityAdmin-headerSearch"
      defaultValue={search}
      key={search}
      label="Search users, groups and roles"
      onSearch={(value) =>
        navigate(
          value
            ? `../overview?${new URLSearchParams({ [SEARCH_PARAM]: value })}`
            : "../overview",
          { relative: "path" },
        )
      }
    />
  );
};

const AdminLayout = () => {
  const [editing, setEditing] = useState(false);
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        editing && currentLocation.pathname !== nextLocation.pathname,
      [editing],
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
  }, [closePrompt, proceed, reset, showPrompt, state]);

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
                Application access, users, groups and roles
              </Text>
            </div>
          </div>
          <HeaderSearch />
        </header>
        <div className="vuuIdentityAdmin-workspace">
          <VerticalNavigation
            appearance="indicator"
            aria-label="Identity administration"
            className="vuuIdentityAdmin-navigation"
          >
            {PAGES.map((page) => (
              <NavItem key={page.page} {...page} />
            ))}
          </VerticalNavigation>
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
      </div>
    </EditingContext.Provider>
  );
};

export interface UserAdminProps {
  config?: AdminConfig;
}

const UserAdmin = ({ config = EMPTY_CONFIG }: UserAdminProps) => (
  <NotificationsProvider>
    <AdminDataContext.Provider value={config}>
      <ApplicationModelProvider>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<OverviewPage />} />
            <Route path="applications" element={<ApplicationsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="groups" element={<GroupsPage />} />
            <Route path="roles" element={<RolesPage />} />
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
);

export default UserAdmin;
