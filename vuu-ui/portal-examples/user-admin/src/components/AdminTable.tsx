import type { TableConfig } from "@vuu-ui/vuu-table-types";
import { Table } from "@vuu-ui/vuu-table";
import { DataSourceStats, TableFooter } from "@vuu-ui/vuu-table-extras";
import { useMemo } from "react";
import {
  INTERNAL_COLUMNS,
  type AdminQuery,
  type AdminRecord,
  type AdminTableName,
} from "../data/admin-contract";
import { useAdminTable, type AdminTableResource } from "../data/useAdminTable";

export interface AdminTableViewProps {
  resource: AdminTableResource;
  onSelect?: (record: AdminRecord | undefined) => void;
  selectionDisabled?: boolean;
  title?: string;
}

export const AdminTableView = ({
  resource: { schema, dataSource, error, loading },
  onSelect,
  selectionDisabled,
  title,
}: AdminTableViewProps) => {
  const config = useMemo<TableConfig>(
    () => ({
      columns:
        schema?.columns
          .filter(({ name }) => !INTERNAL_COLUMNS.has(name))
          .map((column) => ({ ...column, editable: false })) ?? [],
      columnLayout: "static",
      rowSeparators: true,
      zebraStripes: true,
    }),
    [schema],
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
  return <AdminTableView {...props} resource={resource} />;
};
