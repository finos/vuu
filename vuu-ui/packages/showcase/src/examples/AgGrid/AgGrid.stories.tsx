import { AgGridReact } from "ag-grid-react";

import "ag-grid-enterprise";
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-alpine.css";

import { ArrayLike } from "./AgGridArrayLike";
import {
  authenticate as vuuAuthenticate,
  connectToServer,
  RemoteDataSource,
  useDataSource,
} from "@vuu-ui/data-remote";
import { VuuUIRow } from "@vuu-ui/data-remote/src/vuuUIMessageTypes";
import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { metadataKeys, WindowRange } from "@vuu-ui/utils";

const { IDX, KEY } = metadataKeys;

const toAgGridRow = (data: VuuUIRow) => {
  return {
    bbg: data[8],
    currency: data[9],
    description: data[10],
    exchange: data[11],
    isin: data[12],
    lotSize: data[13],
    ric: data[14],
  };
};

const useAgGridData = (data, size, range) => {
  const ref = useRef<ArrayLike>();
  console.log(
    `useAgGridData ${data.length} rows, size = ${size}, range=${JSON.stringify(
      range
    )}  `
  );
  const windowedData = useMemo(() => {
    if (ref.current === undefined) {
      ref.current = new ArrayLike(
        data.map(toAgGridRow),
        size,
        new WindowRange(range.from, range.to)
      );
    } else {
      ref.current.length = size;
      ref.current.range = range;
      ref.current.data = data.map(toAgGridRow);
    }
    return ref.current;
  }, [data, range, size]);

  return {
    data: windowedData,
    itemToCollectionItem: (sel) => {
      if (sel) {
        const [idx] = sel;
        return windowedData[idx];
      }
      return null;
    },
  };
};

export const AgGrid = () => {
  const [data, setData] = useState<string[]>([]);

  const columnDefs = useMemo(
    () => [
      { field: "bbg" },
      { field: "currency" },
      { field: "description" },
      { field: "exchange" },
      { field: "isin" },
      { field: "lotSize" },
      { field: "ric" },
    ],
    []
  );

  const dataSource = useMemo(() => {
    const dataConfig = {
      bufferSize: 100,
      columns: [
        "bbg",
        "currency",
        "description",
        "exchange",
        "isin",
        "lotSize",
        "ric",
      ],
      table: { table: "instruments", module: "SIMUL" },
      serverUrl: "127.0.0.1:8090/websocket",
    };
    return new RemoteDataSource(dataConfig);
  }, []);

  const [data2, size, range, setRange] = useDataSource({ dataSource });
  const { data: rowData } = useAgGridData(data2, size, range);

  console.log(`rowData is an array ${Array.isArray(rowData)}`);

  useEffect(() => {
    const connect = async () => {
      console.log(`DataList stories authenticate as steve`);
      const authToken = (await vuuAuthenticate("steve", "xyz")) as string;
      connectToServer("127.0.0.1:8090/websocket", authToken);
    };
    connect();
  }, []);

  const layout = {
    display: "grid",
    gridTemplateColumns: "1fr",
    gridTemplateRows: "1fr",
    gap: "10px 20px",
    height: 500,
    margin: "10px auto",
    width: 800,
  } as CSSProperties;

  return (
    <div style={layout}>
      <div className="ag-theme-alpine">
        <AgGridReact columnDefs={columnDefs} rowModelType="serverSide" />
      </div>
    </div>
  );
};
