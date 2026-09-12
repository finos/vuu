import { usePortalModuleRegistry } from "@vuu-ui/core/portal";
import type { TableCellRendererProps } from "@vuu-ui/vuu-table-types";
import { registerComponent } from "@vuu-ui/vuu-utils";

export const CLIENT_IDENTIFIER_CELL_RENDERER =
  "vuu-portal-client-identifier-cell";

export const resolveClientIdentifierLabel = (
  identifier: unknown,
  remoteModules: ReturnType<typeof usePortalModuleRegistry>["remoteModules"],
) => {
  const module = remoteModules.find(
    ({ clientIdentifier }) => clientIdentifier === identifier,
  );
  return module?.title ?? module?.name ?? String(identifier ?? "");
};

export const ClientIdentifierCell = ({
  column,
  dataRow,
}: TableCellRendererProps) => {
  const { remoteModules } = usePortalModuleRegistry();
  return (
    <>{resolveClientIdentifierLabel(dataRow[column.name], remoteModules)}</>
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
