import { Tag, Text } from "@salt-ds/core";
import type { usePortalModuleRegistry } from "@vuu-ui/core/portal";
import type { TableCellRendererProps } from "@vuu-ui/vuu-table-types";
import { registerComponent } from "@vuu-ui/vuu-utils";
import { createContext, useContext } from "react";
import { visibleAccessRoles } from "../data/userList";
import { useApplications } from "../data/useApplicationModel";
import { AppTag } from "./admin-ui/AdminUi";

export const MODULE_ACCESS_CELL_RENDERER = "vuu-portal-module-access-cell";

/** Most application tags a cell shows before "+N more". */
export const MAX_ACCESS_TAGS = 3;

/** Access roles whose tags come first in every cell below the provider. */
export const FirstAccessRolesContext = createContext<readonly string[]>([]);

export const resolveModuleAccessValues = (
  value: unknown,
  remoteModules: ReturnType<typeof usePortalModuleRegistry>["remoteModules"],
) => {
  const accessRoles =
    typeof value === "string"
      ? value
          .split(",")
          .map((accessRole) => accessRole.trim())
          .filter(Boolean)
      : [];

  if (!accessRoles.length) return ["No module access"];

  return accessRoles.map((accessRole) => {
    const module = remoteModules.find(
      ({ accessRole: moduleAccessRole }) => moduleAccessRole === accessRole,
    );
    return module?.title ?? module?.name ?? accessRole;
  });
};

export const resolveModuleAccessSummary = (
  value: unknown,
  remoteModules: ReturnType<typeof usePortalModuleRegistry>["remoteModules"],
) => resolveModuleAccessValues(value, remoteModules).join(", ");

const accessRolesOf = (value: unknown) =>
  typeof value === "string"
    ? value
        .split(",")
        .map((accessRole) => accessRole.trim())
        .filter(Boolean)
    : [];

/**
 * A coloured tag for each application the user can open, up to
 * MAX_ACCESS_TAGS, then a "+N more" tag naming the rest.
 */
export const ModuleAccessCell = ({
  column,
  dataRow,
}: TableCellRendererProps) => {
  const { applications } = useApplications();
  const firstAccessRoles = useContext(FirstAccessRolesContext);
  const accessRoles = accessRolesOf(dataRow[column.name]);
  if (accessRoles.length === 0) {
    return (
      <Text color="secondary" styleAs="label">
        No application access
      </Text>
    );
  }
  const titleOf = (accessRole: string) =>
    applications.find((app) => app.accessRole === accessRole)?.title ??
    accessRole;
  const { hidden, shown } = visibleAccessRoles(
    accessRoles,
    firstAccessRoles,
    MAX_ACCESS_TAGS,
  );
  return (
    <span
      className="vuuIdentityAdmin-cell"
      title={accessRoles.map(titleOf).join(", ")}
    >
      {shown.map((accessRole) => {
        const application = applications.find(
          (candidate) => candidate.accessRole === accessRole,
        );
        return application ? (
          <AppTag application={application} key={accessRole} />
        ) : (
          <Tag key={accessRole}>{accessRole}</Tag>
        );
      })}
      {hidden.length > 0 ? (
        <Tag bordered title={hidden.map(titleOf).join(", ")}>
          +{hidden.length} more
        </Tag>
      ) : null}
    </span>
  );
};

registerComponent(
  MODULE_ACCESS_CELL_RENDERER,
  ModuleAccessCell,
  "cell-renderer",
  {
    serverDataType: "string",
    userCanAssign: false,
  },
);
