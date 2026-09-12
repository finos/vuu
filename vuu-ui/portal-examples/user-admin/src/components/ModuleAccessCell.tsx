import { usePortalModuleRegistry } from "@vuu-ui/core/portal";
import type { TableCellRendererProps } from "@vuu-ui/vuu-table-types";
import { registerComponent } from "@vuu-ui/vuu-utils";

export const MODULE_ACCESS_CELL_RENDERER = "vuu-portal-module-access-cell";

export const resolveModuleAccessSummary = (
  value: unknown,
  remoteModules: ReturnType<typeof usePortalModuleRegistry>["remoteModules"],
) => {
  const loginRoles =
    typeof value === "string"
      ? value
          .split(",")
          .map((loginRole) => loginRole.trim())
          .filter(Boolean)
      : [];

  if (!loginRoles.length) return "No module access";

  return loginRoles
    .map((loginRole) => {
      const module = remoteModules.find(
        ({ loginRole: moduleLoginRole }) => moduleLoginRole === loginRole,
      );
      return module?.title ?? module?.name ?? loginRole;
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
