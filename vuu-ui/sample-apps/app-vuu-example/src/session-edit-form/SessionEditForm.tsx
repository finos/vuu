import { DataSourceRow, RemoteDataSource, TableSchema } from "@finos/vuu-data";
import { buildColumnMap } from "@finos/vuu-utils";
import { Button } from "@salt-ds/core";
import {
  HTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface SessionEditFormProps extends HTMLAttributes<HTMLDivElement> {
  onClose: () => void;
  schema: TableSchema;
}

export const SessionEditForm = ({
  onClose,
  schema,
  ...htmlAttributes
}: SessionEditFormProps) => {
  const [processId, setProcessId] = useState("");
  const [sequenceNo, setSequenceNo] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const renderData = useCallback((row: DataSourceRow) => {
    const process = row[8] as string;
    const sequenceNo = row[9];
    console.log(`processNo ${process}, sequenceNo ${sequenceNo}`);
    setProcessId(process);
  }, []);

  const dataSource = useMemo(() => {
    const ds = new RemoteDataSource({
      bufferSize: 0,
      table: schema.table,
      columns: schema.columns.map((col) => col.name),
    });
    const columnMap = buildColumnMap(ds.columns);
    ds.subscribe({ range: { from: 0, to: 5 } }, (message) => {
      if (message.type === "viewport-update" && message.rows) {
        renderData(message.rows[0]);
      }
    });
    return ds;
  }, [schema]);

  const handleChange = useCallback(
    (evt) => {
      dataSource.menuRpcCall({
        rowKey: processId,
        field: "sequenceNumber",
        value: evt.target.value,
        type: "VP_EDIT_CELL_RPC",
      } as any);
    },
    [dataSource, processId]
  );

  const handleSubmit = useCallback(async () => {
    const response = await dataSource.menuRpcCall({
      type: "VP_EDIT_SUBMIT_FORM_RPC",
    } as any);
    if (response.error) {
      setErrorMessage(response.error);
    }
  }, [dataSource]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    return () => {
      dataSource.unsubscribe();
    };
  }, [dataSource]);

  return (
    <div {...htmlAttributes}>
      <div>
        Enter a sequence No for process<span>{processId}</span>{" "}
      </div>
      <div>
        <input defaultValue={sequenceNo} onChange={handleChange} />
      </div>
      <div>
        <span>{errorMessage}</span>
      </div>
      <div>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>Submit</Button>
      </div>
    </div>
  );
};
