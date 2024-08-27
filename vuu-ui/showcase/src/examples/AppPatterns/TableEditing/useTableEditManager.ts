import {
  DataSource,
  DataSourceRow,
  Selection,
  SelectionChangeHandler,
} from "@finos/vuu-data-types";
import {
  VuuRowDataItemType,
  VuuRpcMenuRequest,
  VuuRpcResponse,
  VuuTable,
} from "@finos/vuu-protocol-types";
import {
  ColumnMap,
  buildColumnMap,
  isOpenBulkEditResponse,
  messageHasDataRows,
  queryClosest,
  useDataSource,
  viewportRpcRequest,
} from "@finos/vuu-utils";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  EmptyInstrument,
  Instrument,
  isValidInstrument,
} from "./instrument-editing";

type Entity = { [key: string]: VuuRowDataItemType };
const dataSourceRowToEntity = (row: DataSourceRow, columnMap: ColumnMap) =>
  Object.entries(columnMap).reduce((entity, [name, index]) => {
    entity[name] = row[index];
    return entity;
  }, {} as Entity);

const getField = (target: EventTarget | HTMLElement) => {
  const fieldElement = queryClosest(target, "[data-field]");
  if (fieldElement) {
    return fieldElement.dataset.field as string;
  } else {
    throw Error("no field ");
  }
};

export const useTableEditManager = (vuuTable: VuuTable) => {
  const [open, setOpen] = useState(false);
  const [entity, setEntity] = useState<Instrument>(EmptyInstrument);
  const sessionRef = useRef<DataSource>();
  const { VuuDataSource } = useDataSource();

  const setSessionDataSource = useCallback((ds: DataSource | undefined) => {
    if (ds) {
      const columnMap = buildColumnMap(ds.columns);
      ds?.subscribe({ range: { from: 0, to: 1 } }, (message) => {
        if (messageHasDataRows(message)) {
          const [row] = message.rows;
          if (row) {
            const entity = dataSourceRowToEntity(row, columnMap);
            if (isValidInstrument(entity)) {
              setEntity(entity);
            }
          }
        }
      });
      sessionRef.current = ds;
    }
  }, []);

  const dataSource = useMemo(() => {
    const ds = new VuuDataSource({
      table: vuuTable,
    });
    return ds;
  }, [VuuDataSource, vuuTable]);

  const handleSelectionChange = useCallback<SelectionChangeHandler>(
    (selection: Selection) => {
      if (selection.length > 0) {
        setOpen(true);
        if (sessionRef.current) {
          sessionRef.current.rpcCall?.(
            viewportRpcRequest("VP_BULK_EDIT_END_RPC"),
          );
        }
        dataSource
          .menuRpcCall({
            rpcName: "VP_BULK_EDIT_BEGIN_RPC",
            type: "VIEW_PORT_MENUS_SELECT_RPC",
          } as Omit<VuuRpcMenuRequest, "vpId">)
          .then((rpcResponse: VuuRpcResponse) => {
            if (isOpenBulkEditResponse(rpcResponse)) {
              const { table } = rpcResponse.action;
              const sessionDs = new VuuDataSource({
                table,
                viewport: table.table,
              });
              setSessionDataSource(sessionDs);
            }
          });
      } else {
        setOpen(false);
      }
    },
    [VuuDataSource, dataSource, setSessionDataSource],
  );

  const handleChangeFormField = useCallback((evt) => {
    const fieldName = getField(evt.target);
    const value = evt.target.value as string;
    if (fieldName) {
      setEntity((currentEntity) => ({ ...currentEntity, [fieldName]: value }));
    }
  }, []);

  const handleCommitFieldValue = useCallback(
    (field: string, value: VuuRowDataItemType) => {
      const { current: ds } = sessionRef;
      const { ric: key } = entity;
      if (ds && key) {
        ds.applyEdit(key, field, value).then((rpcResponse) => {
          console.log({ rpcResponse });
        });
      } else {
        throw Error("field value committed, but no session ds");
      }
    },
    [entity],
  );

  const handleSubmit = useCallback(async () => {
    const { current: ds } = sessionRef;
    const rpcResponse = await ds?.rpcCall?.(
      viewportRpcRequest("VP_BULK_EDIT_SUBMIT_RPC"),
    );
    // chec k for valid response
    console.log({ rpcResponse });
  }, []);

  return {
    dataSource,
    entity,
    open,
    onChangeFormField: handleChangeFormField,
    onCommitFieldValue: handleCommitFieldValue,
    onSelectionChange: handleSelectionChange,
    onSubmit: handleSubmit,
  };
};
