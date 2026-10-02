import { H4 } from "@salt-ds/core";
import { DataSourceStats, TableFooter } from "@vuu-ui/vuu-table-extras";
import { Table } from "@vuu-ui/vuu-table";
import type { TableConfig } from "@vuu-ui/vuu-table-types";
import { useMemo } from "react";
import { CLIENT_IDENTIFIER_CELL_RENDERER } from "./ClientIdentifierCell";
import { MODULE_ACCESS_CELL_RENDERER } from "./ModuleAccessCell";
import { useAdminConfig } from "../data/AdminDataContext";
import {
  columnFor,
  displayColumnsFor,
  type AdminQuery,
  type AdminRecord,
  type AdminTableName,
} from "../data/admin-contract";
import { useAdminTable, type AdminTableResource } from "../data/useAdminTable";

const withModuleAccessRenderer = (
  name: AdminTableName,
  column: ReturnType<typeof displayColumnsFor>[number],
  moduleAccessColumn: string,
) =>
  name === "users" && column.name === moduleAccessColumn
    ? {
        ...column,
        type: {
          name: "string" as const,
          renderer: { name: MODULE_ACCESS_CELL_RENDERER },
        },
      }
    : column;

const withClientIdentifierRenderer = (
  name: AdminTableName,
  column: ReturnType<typeof displayColumnsFor>[number],
  clientIdentifierColumn: string,
) =>
  ["roles", "group_roles", "user_group_roles"].includes(name) &&
  column.name === clientIdentifierColumn
    ? {
        ...column,
        type: {
          name: "string" as const,
          renderer: { name: CLIENT_IDENTIFIER_CELL_RENDERER },
        },
      }
    : column;

export interface OverviewTableViewProps {
  name: AdminTableName;
  resource: AdminTableResource;
  onSelect?: (record: AdminRecord | undefined) => void;
  selectionDisabled?: boolean;
  title?: string;
}

const OverviewTableView = ({
  name,
  resource: { schema, dataSource, error, loading },
  onSelect,
  selectionDisabled,
  title,
}: OverviewTableViewProps) => {
  const adminConfig = useAdminConfig();
  const config = useMemo<TableConfig>(
    () => ({
      columns: schema
        ? displayColumnsFor(schema, adminConfig, name).map((column) => {
            const moduleAccessColumn = withModuleAccessRenderer(
              name,
              column,
              columnFor(adminConfig, name, "module_access"),
            );
            const renderedColumn = withClientIdentifierRenderer(
              name,
              moduleAccessColumn,
              columnFor(adminConfig, name, "client_identifier"),
            );
            return {
              ...renderedColumn,
              ...(renderedColumn.name === "email" ||
              renderedColumn.name === columnFor(adminConfig, name, "email")
                ? { width: 150 }
                : {}),
              editable: false,
            };
          })
        : [],
      columnLayout: "static",
      columnDefaultWidth: 120,
      columnSeparators: false,
      rowSeparators: true,
      zebraStripes: false,
    }),
    [adminConfig, name, schema],
  );

  return (
    <section className="vuuIdentityAdmin-table" aria-label={title}>
      {title ? <H4>{title}</H4> : null}
      {error ? (
        <p role="alert">{error}</p>
      ) : loading ? (
        <p role="status">Loading table...</p>
      ) : schema && dataSource ? (
        <>
          <div className="vuuIdentityAdmin-tableViewport vuuIdentityAdmin-tableCard">
            <Table
              config={config}
              dataSource={dataSource}
              height="100%"
              width="100%"
              navigationStyle="row"
              selectionModel={
                onSelect && !selectionDisabled ? "single" : "none"
              }
              onSelect={
                selectionDisabled
                  ? undefined
                  : (row) =>
                      onSelect?.(
                        row
                          ? {
                              ...Object.fromEntries(
                                schema.columns.map(({ name }) => [
                                  name,
                                  row[name],
                                ]),
                              ),
                              key: row.key,
                            }
                          : undefined,
                      )
              }
              renderBufferSize={20}
            />
          </div>
          <TableFooter>
            <DataSourceStats dataSource={dataSource} />
          </TableFooter>
        </>
      ) : null}
    </section>
  );
};

export const OverviewTable = ({
  name,
  query,
  ...props
}: Omit<OverviewTableViewProps, "resource"> & {
  name: AdminTableName;
  query?: AdminQuery;
}) => {
  const resource = useAdminTable(name, query);
  return <OverviewTableView {...props} name={name} resource={resource} />;
};
