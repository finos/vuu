import { usePortalModuleRegistry } from "@vuu-ui/core/portal";
import type { TableCellRendererProps } from "@vuu-ui/vuu-table-types";
import { registerComponent } from "@vuu-ui/vuu-utils";

export const CLIENT_IDENTIFIER_CELL_RENDERER =
  "vuu-portal-client-identifier-cell";

export const resolveClientIdentifierLabel = (
  clientIdentifier: unknown,
  roleName: unknown,
  remoteModules: ReturnType<typeof usePortalModuleRegistry>["remoteModules"],
) => {
  const module = remoteModules.find(
    ({ loginRole }) => loginRole === roleName,
  );
  return module?.clientIdentifier ?? String(clientIdentifier ?? "");
};

export const ClientIdentifierCell = ({
  column,
  dataRow,
}: TableCellRendererProps) => {
  const { remoteModules } = usePortalModuleRegistry();
  return (
    <>
      {resolveClientIdentifierLabel(
        dataRow[column.name],
        dataRow.role_name,
        remoteModules,
      )}
    </>
  );
};

registerComponent(
  CLIENT_IDENTIFIER_CELL_RENDERER,
  ClientIdentifierCell,
  "cell-renderer",
  {
    serverDataType: "string",
    userCanAssign: false,
  },
);
