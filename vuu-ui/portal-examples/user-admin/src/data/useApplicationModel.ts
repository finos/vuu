import { usePortalModuleRegistry } from "@vuu-ui/core/portal";
import { createContext, useContext, useMemo } from "react";
import {
  buildApplicationModel,
  deriveApplications,
  type ApplicationModel,
} from "./applications";
import { USER_ADMIN_TABLES } from "./user-admin-tables";
import { useLookupRows } from "./useLookupRows";

export const useApplications = () => {
  const { remoteModules } = usePortalModuleRegistry();
  return useMemo(() => deriveApplications(remoteModules), [remoteModules]);
};

const CLIENT_COLUMNS = ["client_id", "client_identifier", "client_name"];
const GROUP_COLUMNS = [
  "group_id",
  "group_display_name",
  "group_path",
  "user_count",
];
const GROUP_ROLE_COLUMNS = ["assignment_id", "group_id", "role_id"];
const ROLE_COLUMNS = [
  "role_id",
  "role_name",
  "role_display_name",
  "client_identifier",
];

export interface ApplicationModelResource {
  error?: string;
  loading: boolean;
  model: ApplicationModel;
}

const EMPTY_MODEL = buildApplicationModel({
  applications: [],
  clients: [],
  groupRoles: [],
  groups: [],
  roles: [],
});

export const ApplicationModelContext = createContext<ApplicationModelResource>({
  loading: false,
  model: EMPTY_MODEL,
});

/** The application model published by the nearest ApplicationModelProvider. */
export const useApplicationModel = () => useContext(ApplicationModelContext);

/**
 * Joins the portal module registry with the Keycloak reference tables to
 * derive applications, their groups and roles, and configuration issues.
 */
export const useLoadApplicationModel = (): ApplicationModelResource => {
  const { applications, issues } = useApplications();
  const clients = useLookupRows(USER_ADMIN_TABLES.clients, CLIENT_COLUMNS);
  const groups = useLookupRows(USER_ADMIN_TABLES.groups, GROUP_COLUMNS);
  const groupRoles = useLookupRows(
    USER_ADMIN_TABLES.groupRoles,
    GROUP_ROLE_COLUMNS,
  );
  const roles = useLookupRows(USER_ADMIN_TABLES.roles, ROLE_COLUMNS);

  const model = useMemo(
    () =>
      buildApplicationModel({
        applications,
        clients: clients.rows,
        descriptorIssues: issues,
        groupRoles: groupRoles.rows,
        groups: groups.rows,
        roles: roles.rows,
      }),
    [
      applications,
      clients.rows,
      groupRoles.rows,
      groups.rows,
      issues,
      roles.rows,
    ],
  );

  const error =
    clients.error ?? groups.error ?? groupRoles.error ?? roles.error;
  const loading =
    clients.loading || groups.loading || groupRoles.loading || roles.loading;
  return useMemo(() => ({ error, loading, model }), [error, loading, model]);
};
