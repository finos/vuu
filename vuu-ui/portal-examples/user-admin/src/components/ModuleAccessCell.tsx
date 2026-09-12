import { usePortalModuleRegistry } from "@vuu-ui/core/portal";
import type { TableCellRendererProps } from "@vuu-ui/vuu-table-types";
import { registerComponent } from "@vuu-ui/vuu-utils";

export const MODULE_ACCESS_CELL_RENDERER = "vuu-portal-module-access-cell";

export const resolveModuleAccessSummary = (
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

  if (!accessRoles.length) return "No module access";

  return accessRoles
    .map((accessRole) => {
      const module = remoteModules.find(
        ({ loginRole: moduleAccessRole }) => moduleAccessRole === accessRole,
      );
      return module?.title ?? module?.name ?? accessRole;
    })
    .join(", ");
};

export const ModuleAccessCell = ({
  column,
  dataRow,
}: TableCellRendererProps) => {
  const { remoteModules } = usePortalModuleRegistry();
  return <>{resolveModuleAccessSummary(dataRow[column.name], remoteModules)}</>;
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
