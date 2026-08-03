import { CsvUpload } from "@vuu-ui/vuu-table-extras";
import type { DataSource, TableSchema } from "@vuu-ui/vuu-data-types";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@salt-ds/core";

const mockSchema: TableSchema = {
  columns: [
    { name: "id", serverDataType: "string" },
    { name: "name", serverDataType: "string" },
    { name: "price", serverDataType: "double" },
  ],
  key: "id",
  table: { module: "TEST", table: "instruments" },
};

const createMockDataSource = (): DataSource =>
  ({
    table: { module: "TEST", table: "instruments" },
    tableSchema: mockSchema,
    rpcRequest: async () => ({ type: "ACTION_RESULT", action: { type: "NO_ACTION" } }),
    endEditSession: async () => ({ type: "ACTION_RESULT", action: { type: "NO_ACTION" } }),
    subscribe: async () => void 0,
    unsubscribe: () => void 0,
  }) as unknown as DataSource;

export const DefaultCsvUpload = () => {
  const dataSource = useMemo(() => createMockDataSource(), []);
  return <CsvUpload dataSource={dataSource} />;
};

export const CsvUploadWithCancelCallback = () => {
  const dataSource = useMemo(() => createMockDataSource(), []);
  const [cancelled, setCancelled] = useState(false);

  const handleCancel = useCallback(() => {
    setCancelled(true);
  }, []);

  return (
    <div>
      {cancelled ? (
        <span data-testid="cancel-result">cancelled</span>
      ) : null}
      <CsvUpload dataSource={dataSource} onCancel={handleCancel} />
    </div>
  );
};

export const ClosedCsvUpload = () => {
  const dataSource = useMemo(() => createMockDataSource(), []);
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open Upload Dialog</Button>
      <CsvUpload dataSource={dataSource} open={open} onCancel={() => setOpen(false)} />
    </div>
  );
};

export const CsvUploadCustomTitle = () => {
  const dataSource = useMemo(() => createMockDataSource(), []);
  return (
    <CsvUpload dataSource={dataSource} dialogTitle="Upload Instruments CSV" />
  );
};

const instrumentsSchema: TableSchema = {
  columns: [
    { name: "bbg", serverDataType: "string" },
    { name: "currency", serverDataType: "string" },
    { name: "description", serverDataType: "string" },
    { name: "exchange", serverDataType: "string" },
    { name: "isin", serverDataType: "string" },
    { name: "lotSize", serverDataType: "int" },
    { name: "ric", serverDataType: "string" },
  ],
  key: "isin",
  table: { module: "TEST", table: "instruments" },
};

const createInstrumentsMockDataSource = (): DataSource =>
  ({
    table: { module: "TEST", table: "instruments" },
    tableSchema: instrumentsSchema,
    subscribe: async () => void 0,
    unsubscribe: () => void 0,
  }) as unknown as DataSource;

export const CsvUploadWithInstrumentsSchema = () => {
  const dataSource = useMemo(() => createInstrumentsMockDataSource(), []);
  return <CsvUpload dataSource={dataSource} />;
};
