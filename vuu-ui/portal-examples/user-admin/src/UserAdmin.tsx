import { NotificationsProvider } from "@vuu-ui/vuu-notifications";
import { useState } from "react";
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useBeforeUnload,
} from "react-router-dom";
import { EditingContext } from "./components/EditingContext";
import { AdminDataContext } from "./data/AdminDataContext";
import { EMPTY_CONFIG, type AdminConfig } from "./data/admin-contract";
import { GroupsPage } from "./pages/groups/GroupsPage";
import { OverviewPage } from "./pages/overview/OverviewPage";
import { RolesPage } from "./pages/roles/RolesPage";
import { UsersPage } from "./pages/users/UsersPage";
import "./UserAdmin.css";

const AdminLayout = () => {
  const [editing, setEditing] = useState(false);
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
          <h1>Vuu Identity Admin</h1>
          <p>Users, groups and client roles</p>
        </header>
        <div className="vuuIdentityAdmin-workspace">
          <nav
            aria-label="Identity administration"
            className="vuuIdentityAdmin-navigation"
          >
            {(["overview", "users", "groups", "roles"] as const).map((page) => (
              <NavLink
                key={page}
                to={page}
                aria-disabled={editing || undefined}
                onClick={(event) => {
                  if (editing) event.preventDefault();
                }}
                tabIndex={editing ? -1 : undefined}
              >
                {page[0].toUpperCase() + page.slice(1)}
              </NavLink>
            ))}
          </nav>
          <div className="vuuIdentityAdmin-content">
            {editing ? (
              <p role="status" className="vuuIdentityAdmin-editNotice">
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
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="groups" element={<GroupsPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route
            path="*"
            element={
              <p>
                Page not found. <Link to="../overview">Return to Overview</Link>
              </p>
            }
          />
        </Route>
      </Routes>
    </AdminDataContext.Provider>
  </NotificationsProvider>
);

export default UserAdmin;
