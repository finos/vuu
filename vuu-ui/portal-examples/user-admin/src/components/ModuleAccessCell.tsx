import { Tag, Text } from "@salt-ds/core";
import type { usePortalModuleRegistry } from "@vuu-ui/core/portal";
import type { TableCellRendererProps } from "@vuu-ui/vuu-table-types";
import { registerComponent } from "@vuu-ui/vuu-utils";
import { useApplications } from "../data/useApplicationModel";
import { AppTag } from "./admin-ui/AdminUi";

export const MODULE_ACCESS_CELL_RENDERER = "vuu-portal-module-access-cell";

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

/** One coloured tag per application the user can open. */
export const ModuleAccessCell = ({
  column,
  dataRow,
}: TableCellRendererProps) => {
  const { applications } = useApplications();
  const accessRoles = accessRolesOf(dataRow[column.name]);
  if (accessRoles.length === 0) {
    return (
      <Text color="secondary" styleAs="label">
        No application access
      </Text>
    );
  }
  return (
    <span
      className="vuuIdentityAdmin-cell"
      title={accessRoles
        .map(
          (accessRole) =>
            applications.find((app) => app.accessRole === accessRole)?.title ??
            accessRole,
        )
        .join(", ")}
    >
      {accessRoles.map((accessRole) => {
        const application = applications.find(
          (candidate) => candidate.accessRole === accessRole,
        );
        return application ? (
          <AppTag application={application} key={accessRole} />
        ) : (
          <Tag key={accessRole}>{accessRole}</Tag>
        );
      })}
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
