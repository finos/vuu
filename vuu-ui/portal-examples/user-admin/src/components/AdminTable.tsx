import type { TableConfig } from "@vuu-ui/vuu-table-types";
import { Table } from "@vuu-ui/vuu-table";
import { DataSourceStats, TableFooter } from "@vuu-ui/vuu-table-extras";
import { useMemo } from "react";
import { CLIENT_IDENTIFIER_CELL_RENDERER } from "./ClientIdentifierCell";
import { useAdminConfig } from "../data/AdminDataContext";
import {
  displayColumnsFor,
  columnFor,
  type AdminQuery,
  type AdminRecord,
  type AdminTableName,
} from "../data/admin-contract";
import { useAdminTable, type AdminTableResource } from "../data/useAdminTable";

const MODULE_CLIENT_IDENTIFIER_TABLES = new Set<AdminTableName>([
  "roles",
  "group_roles",
  "user_group_roles",
]);

const withClientIdentifierRenderer = (
  name: AdminTableName,
  column: ReturnType<typeof displayColumnsFor>[number],
  clientIdentifierColumn: string,
) =>
  MODULE_CLIENT_IDENTIFIER_TABLES.has(name) &&
  column.name === clientIdentifierColumn
    ? {
        ...column,
        type: {
          name: "string" as const,
          renderer: { name: CLIENT_IDENTIFIER_CELL_RENDERER },
        },
      }
    : column;

export interface AdminTableViewProps {
  name: AdminTableName;
  resource: AdminTableResource;
  onSelect?: (record: AdminRecord | undefined) => void;
  selectionDisabled?: boolean;
  title?: string;
}

export const AdminTableView = ({
  name,
  resource: { schema, dataSource, error, loading },
  onSelect,
  selectionDisabled,
  title,
}: AdminTableViewProps) => {
  const adminConfig = useAdminConfig();
  const config = useMemo<TableConfig>(
    () => ({
      columns: schema
        ? displayColumnsFor(schema, adminConfig, name).map((column) => {
            const renderedColumn = withClientIdentifierRenderer(
              name,
              column,
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
      rowSeparators: true,
      zebraStripes: true,
    }),
    [adminConfig, name, schema],
  );

  return (
    <section className="vuuIdentityAdmin-table" aria-label={title}>
      {title ? <h3>{title}</h3> : null}
      {error ? (
        <p role="alert">{error}</p>
      ) : loading ? (
        <p role="status">Loading table...</p>
      ) : schema && dataSource ? (
        <>
          <div className="vuuIdentityAdmin-tableViewport">
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

export const AdminTable = ({
  name,
  query,
  ...props
}: Omit<AdminTableViewProps, "resource"> & {
  name: AdminTableName;
  query?: AdminQuery;
}) => {
  const resource = useAdminTable(name, query);
  return <AdminTableView {...props} name={name} resource={resource} />;
};
